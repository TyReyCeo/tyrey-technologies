"""SaaS subscription billing (Phase 4 commercialization layer)."""

import stripe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from ..schemas import SubscribeRequest
from ..security import get_current_user

router = APIRouter(prefix="/billing", tags=["billing"])

PLAN_PRICES = {
    "starter": lambda: settings.STRIPE_PRICE_STARTER,
    "pro": lambda: settings.STRIPE_PRICE_PRO,
    "executive": lambda: settings.STRIPE_PRICE_EXECUTIVE,
}


def _require_stripe() -> None:
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(503, "Billing is not configured (STRIPE_SECRET_KEY missing)")
    stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/subscribe")
def subscribe(
    req: SubscribeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_stripe()
    price_getter = PLAN_PRICES.get(req.plan)
    if price_getter is None:
        raise HTTPException(400, f"Unknown plan '{req.plan}'")
    price_id = price_getter()
    if not price_id:
        raise HTTPException(503, f"Price ID for plan '{req.plan}' is not configured")

    if not user.stripe_customer_id:
        customer = stripe.Customer.create(email=user.email, metadata={"user_id": user.id})
        user.stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        customer=user.stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        metadata={"user_id": user.id, "plan": req.plan},
        success_url=f"{settings.FRONTEND_URL}/dashboard/billing?upgraded={req.plan}",
        cancel_url=f"{settings.FRONTEND_URL}/dashboard/billing",
    )
    return {"checkout_url": session.url}


@router.post("/portal")
def portal(user: User = Depends(get_current_user)):
    _require_stripe()
    if not user.stripe_customer_id:
        raise HTTPException(409, "No billing account yet — subscribe to a plan first")
    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/dashboard/billing",
    )
    return {"portal_url": session.url}
