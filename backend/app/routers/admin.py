"""Admin console API — every endpoint behind require_admin (ADMIN_EMAILS).

Read-mostly oversight of clients, subscriptions, funnel orders, leads, and
Connect AI, plus two mutations: change a client's plan (comp/support) and
cancel their Stripe subscription at period end. Stripe stays the source of
truth for paid plans — the webhook still applies upgrades/downgrades.
"""

import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..config import settings
from ..connect import usage as connect_usage
from ..connect.models import ConnectNumber, Conversation, UsageRecord
from ..database import get_db
from ..models import Document, Lead, Order, Project, User
from ..schemas import (
    AdminClientDetail,
    AdminClientRow,
    AdminMetric,
    AdminNumberOut,
    AdminOrderOut,
    AdminOverview,
    AdminPlanUpdate,
    AdminSubscriptionCancelResult,
)
from ..security import is_admin_email, require_admin
from .billing import PLAN_PRICES

logger = logging.getLogger("tyrey.admin")
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])

# Monthly list prices (cents) as published on the billing and Connect pages —
# used only for the MRR estimate on the overview.
PLAN_MRR_CENTS = {
    "starter": 4_900,
    "pro": 14_900,
    "executive": 49_900,
    "connect": 49_500,
    "connect_executive": 99_500,
}
VALID_PLANS = {"free", *PLAN_PRICES.keys()}


@router.get("/overview", response_model=AdminOverview)
def overview(db: Session = Depends(get_db)):
    users_by_plan = [
        AdminMetric(label=plan, value=count)
        for plan, count in db.query(User.plan, func.count()).group_by(User.plan).all()
    ]
    leads_by_status = [
        AdminMetric(label=status, value=count)
        for status, count in db.query(Lead.status, func.count()).group_by(Lead.status).all()
    ]
    orders_total, orders_revenue = (
        db.query(func.count(), func.coalesce(func.sum(Order.amount), 0))
        .filter(Order.status.in_(["paid", "generated"]))
        .first()
    )
    period_start, period_end = connect_usage.current_period()
    messages_this_period = (
        db.query(func.coalesce(func.sum(UsageRecord.quantity), 0))
        .filter(
            UsageRecord.created_at >= period_start,
            UsageRecord.created_at < period_end,
        )
        .scalar()
    )
    return AdminOverview(
        users_total=db.query(func.count(User.id)).scalar(),
        users_by_plan=users_by_plan,
        mrr_cents=sum(
            PLAN_MRR_CENTS.get(m.label, 0) * m.value for m in users_by_plan
        ),
        leads_by_status=leads_by_status,
        orders_total=orders_total or 0,
        orders_revenue_cents=orders_revenue or 0,
        connect_active_numbers=db.query(func.count(ConnectNumber.id))
        .filter(ConnectNumber.status == "active")
        .scalar(),
        connect_pending_registration=db.query(func.count(ConnectNumber.id))
        .filter(ConnectNumber.status == "pending_registration")
        .scalar(),
        connect_messages_this_period=int(messages_this_period or 0),
    )


def _counts_by_user(db: Session, column) -> dict[str, int]:
    return dict(db.query(column, func.count()).group_by(column).all())


@router.get("/clients", response_model=list[AdminClientRow])
def list_clients(
    query: str = "",
    plan: str = "",
    limit: int = 200,
    db: Session = Depends(get_db),
):
    q = db.query(User)
    if query:
        q = q.filter(User.email.ilike(f"%{query}%"))
    if plan:
        q = q.filter(User.plan == plan)
    users = q.order_by(User.created_at.desc()).limit(min(max(limit, 1), 1000)).all()

    projects = _counts_by_user(db, Project.user_id)
    documents = _counts_by_user(db, Document.user_id)
    conversations = _counts_by_user(db, Conversation.user_id)
    order_counts = dict(
        db.query(Order.email, func.count()).group_by(Order.email).all()
    )
    return [
        AdminClientRow(
            id=u.id,
            email=u.email,
            plan=u.plan,
            is_admin=is_admin_email(u.email),
            has_billing_account=bool(u.stripe_customer_id),
            projects=projects.get(u.id, 0),
            documents=documents.get(u.id, 0),
            orders=order_counts.get(u.email, 0),
            connect_conversations=conversations.get(u.id, 0),
            created_at=u.created_at,
        )
        for u in users
    ]


def _get_user(user_id: str, db: Session) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "Client not found")
    return user


@router.get("/clients/{user_id}", response_model=AdminClientDetail)
def client_detail(user_id: str, db: Session = Depends(get_db)):
    user = _get_user(user_id, db)
    numbers = (
        db.query(ConnectNumber)
        .filter(ConnectNumber.user_id == user.id, ConnectNumber.status != "released")
        .order_by(ConnectNumber.created_at.desc())
        .all()
    )
    return AdminClientDetail(
        id=user.id,
        email=user.email,
        plan=user.plan,
        is_admin=is_admin_email(user.email),
        stripe_customer_id=user.stripe_customer_id,
        created_at=user.created_at,
        projects=(
            db.query(Project)
            .filter(Project.user_id == user.id)
            .order_by(Project.created_at.desc())
            .all()
        ),
        documents=db.query(func.count(Document.id))
        .filter(Document.user_id == user.id)
        .scalar(),
        orders=(
            db.query(Order)
            .filter(Order.email == user.email)
            .order_by(Order.created_at.desc())
            .all()
        ),
        leads=(
            db.query(Lead)
            .filter(Lead.email == user.email)
            .order_by(Lead.created_at.desc())
            .all()
        ),
        connect_numbers=[
            AdminNumberOut(
                id=n.id,
                e164=n.e164,
                provider=n.provider,
                toll_free=n.toll_free,
                status=n.status,
                owner_email=user.email,
                created_at=n.created_at,
            )
            for n in numbers
        ],
        connect_conversations=db.query(func.count(Conversation.id))
        .filter(Conversation.user_id == user.id)
        .scalar(),
        connect_usage_cents_this_period=connect_usage.summary(db, user.id)[
            "total_cost_cents"
        ],
    )


@router.patch("/clients/{user_id}", response_model=AdminClientRow)
def update_client_plan(
    user_id: str,
    req: AdminPlanUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Manual plan change (comps, support fixes). Stripe webhooks still apply
    normal subscription lifecycle changes on top of this."""
    if req.plan not in VALID_PLANS:
        raise HTTPException(400, f"Invalid plan '{req.plan}'")
    user = _get_user(user_id, db)
    old = user.plan
    user.plan = req.plan
    db.commit()
    logger.info(
        "admin plan change user=%s %s->%s by=%s", user.id, old, req.plan, admin.id
    )
    return AdminClientRow(
        id=user.id,
        email=user.email,
        plan=user.plan,
        is_admin=is_admin_email(user.email),
        has_billing_account=bool(user.stripe_customer_id),
        projects=db.query(func.count(Project.id)).filter(Project.user_id == user.id).scalar(),
        documents=db.query(func.count(Document.id)).filter(Document.user_id == user.id).scalar(),
        orders=db.query(func.count(Order.id)).filter(Order.email == user.email).scalar(),
        connect_conversations=db.query(func.count(Conversation.id))
        .filter(Conversation.user_id == user.id)
        .scalar(),
        created_at=user.created_at,
    )


@router.post(
    "/clients/{user_id}/cancel-subscription",
    response_model=AdminSubscriptionCancelResult,
)
def cancel_subscription(
    user_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    """Cancel the client's active Stripe subscriptions at period end. The
    existing webhook downgrades their plan when the subscription actually
    ends."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(503, "Billing is not configured (STRIPE_SECRET_KEY missing)")
    user = _get_user(user_id, db)
    if not user.stripe_customer_id:
        raise HTTPException(409, "Client has no billing account")

    stripe.api_key = settings.STRIPE_SECRET_KEY
    subs = stripe.Subscription.list(customer=user.stripe_customer_id, status="active")
    cancelled = 0
    for sub in subs.auto_paging_iter():
        stripe.Subscription.modify(sub.id, cancel_at_period_end=True)
        cancelled += 1
    logger.info(
        "admin subscription cancel user=%s count=%d by=%s", user.id, cancelled, admin.id
    )
    detail = (
        f"{cancelled} subscription(s) set to cancel at period end"
        if cancelled
        else "No active subscriptions found"
    )
    return AdminSubscriptionCancelResult(cancelled=cancelled, detail=detail)


@router.get("/orders", response_model=list[AdminOrderOut])
def list_orders(limit: int = 200, db: Session = Depends(get_db)):
    return (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(min(max(limit, 1), 1000))
        .all()
    )


@router.get("/connect/numbers", response_model=list[AdminNumberOut])
def list_all_numbers(db: Session = Depends(get_db)):
    rows = (
        db.query(ConnectNumber, User.email)
        .join(User, User.id == ConnectNumber.user_id)
        .filter(ConnectNumber.status != "released")
        .order_by(ConnectNumber.created_at.desc())
        .all()
    )
    return [
        AdminNumberOut(
            id=n.id,
            e164=n.e164,
            provider=n.provider,
            toll_free=n.toll_free,
            status=n.status,
            owner_email=email,
            created_at=n.created_at,
        )
        for n, email in rows
    ]
