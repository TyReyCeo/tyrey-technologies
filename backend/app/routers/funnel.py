"""Phase 8 revenue funnel: idea -> free preview -> paywall -> checkout -> pack."""

import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from .. import ai_engine
from ..config import settings
from ..database import get_db
from ..models import Order, User
from ..pdf_service import render_pdf
from .billing import PLAN_PRICES
from ..schemas import (
    CheckoutRequest,
    CheckoutResponse,
    OrderOut,
    PreviewRequest,
    PreviewResponse,
)

logger = logging.getLogger("tyrey.funnel")
router = APIRouter(prefix="/funnel", tags=["funnel"])


@router.post("/preview", response_model=PreviewResponse)
def preview(req: PreviewRequest):
    """Free lead magnet: Intelligence Score + outline. No login required."""
    content = ai_engine.generate_preview(req.idea, req.industry, req.stage)
    return PreviewResponse(content=content)


@router.post("/checkout", response_model=CheckoutResponse)
def checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    tier = ai_engine.PACK_TIERS.get(req.tier)
    if tier is None:
        raise HTTPException(400, f"Unknown tier '{req.tier}'")

    order = Order(
        email=req.email,
        idea=req.idea,
        industry=req.industry,
        stage=req.stage,
        tier=req.tier,
        amount=tier["amount"],
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    if not settings.STRIPE_SECRET_KEY:
        # Dev mode: no Stripe configured — fulfill immediately so the full
        # funnel stays testable locally. Never enable in production.
        logger.warning("STRIPE_SECRET_KEY not set — dev-mode instant fulfillment for order %s", order.id)
        _fulfill_order(db, order)
        return CheckoutResponse(
            url=f"{settings.FRONTEND_URL}/success?order_id={order.id}", order_id=order.id
        )

    stripe.api_key = settings.STRIPE_SECRET_KEY
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        customer_email=req.email,
        line_items=[
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": f"TyRey Intelligence — {tier['label']}"},
                    "unit_amount": tier["amount"],
                },
                "quantity": 1,
            }
        ],
        mode="payment",
        metadata={"order_id": order.id},
        success_url=f"{settings.FRONTEND_URL}/success?order_id={order.id}",
        cancel_url=f"{settings.FRONTEND_URL}/",
    )
    order.stripe_session_id = session.id
    db.commit()
    return CheckoutResponse(url=session.url, order_id=order.id)


def _fulfill_order(db: Session, order: Order) -> None:
    """Generate the paid deliverable for an order."""
    if order.status == "generated":
        return
    order.status = "paid"
    db.commit()
    try:
        order.content = ai_engine.generate_pack(
            order.tier, order.idea, order.industry, order.stage
        )
        order.status = "generated"
    except Exception:
        logger.exception("Pack generation failed for order %s", order.id)
        order.status = "failed"
    db.commit()


def _sget(obj, key, default=None):
    """Key access that works on both dicts and StripeObjects (no .get there)."""
    try:
        value = obj[key]
    except (KeyError, TypeError):
        return default
    return default if value is None else value


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(400, "Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        meta = _sget(session, "metadata", {}) or {}
        user_id = _sget(meta, "user_id")
        plan = _sget(meta, "plan")

        if user_id and plan:
            # SaaS subscription checkout created by /billing/subscribe —
            # this is the step that actually activates the paid plan.
            user = db.get(User, user_id)
            if user is not None and plan in PLAN_PRICES:
                user.plan = plan
                db.commit()
                logger.info("Activated plan %s for user %s", plan, user.id)
        else:
            # One-time funnel pack purchase
            order_id = _sget(meta, "order_id")
            order = db.get(Order, order_id) if order_id else None
            if order is None:
                order = (
                    db.query(Order).filter(Order.stripe_session_id == session["id"]).first()
                )
            if order is not None:
                if not order.email:
                    order.email = _sget(_sget(session, "customer_details", {}), "email")
                _fulfill_order(db, order)

    elif event["type"] == "customer.subscription.deleted":
        customer_id = _sget(event["data"]["object"], "customer")
        user = (
            db.query(User).filter(User.stripe_customer_id == customer_id).first()
            if customer_id
            else None
        )
        if user is not None and user.plan != "free":
            logger.info("Subscription ended — downgrading user %s to free", user.id)
            user.plan = "free"
            db.commit()

    return {"status": "success"}


@router.get("/order/{order_id}", response_model=OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(404, "Order not found")
    return order


@router.get("/order/{order_id}/pdf")
def order_pdf(order_id: str, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(404, "Order not found")
    if order.status != "generated" or not order.content:
        raise HTTPException(409, f"Order not ready (status: {order.status})")

    tier_label = ai_engine.PACK_TIERS[order.tier]["label"]
    pdf_bytes = render_pdf(f"TyRey {tier_label}", order.content)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="tyrey-{order.tier}-pack.pdf"'
        },
    )
