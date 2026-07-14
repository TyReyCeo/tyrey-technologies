"""Usage metering. Phase 1 records usage and shows it in-app; reporting
metered usage to Stripe lands in Phase 2 (ARCHITECTURE.md §8), which is what
the `stripe_reported` flag is reserved for."""

import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import UsageRecord

# Internal cost estimates (cents per segment) for the in-app usage display —
# not customer pricing. Reconciled against provider logs monthly (risk item 4).
UNIT_COST_CENTS = {
    "sms_out": 1,
    "sms_in": 1,
    "mms_out": 3,
    "mms_in": 2,
}


def record(
    db: Session,
    *,
    user_id: str,
    kind: str,
    quantity: int = 1,
    message_id: str | None = None,
) -> UsageRecord:
    usage = UsageRecord(
        user_id=user_id,
        kind=kind,
        quantity=quantity,
        unit_cost_cents=UNIT_COST_CENTS.get(kind, 0),
        message_id=message_id,
    )
    db.add(usage)
    return usage


def current_period() -> tuple[datetime.datetime, datetime.datetime]:
    """Current calendar month in UTC."""
    now = datetime.datetime.now(datetime.timezone.utc)
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if start.month == 12:
        end = start.replace(year=start.year + 1, month=1)
    else:
        end = start.replace(month=start.month + 1)
    return start, end


def summary(db: Session, user_id: str) -> dict:
    start, end = current_period()
    rows = (
        db.query(
            UsageRecord.kind,
            func.sum(UsageRecord.quantity),
            func.sum(UsageRecord.quantity * UsageRecord.unit_cost_cents),
        )
        .filter(
            UsageRecord.user_id == user_id,
            UsageRecord.created_at >= start,
            UsageRecord.created_at < end,
        )
        .group_by(UsageRecord.kind)
        .all()
    )
    items = [
        {"kind": kind, "quantity": int(qty or 0), "cost_cents": int(cost or 0)}
        for kind, qty, cost in rows
    ]
    return {
        "period_start": start,
        "period_end": end,
        "items": items,
        "total_cost_cents": sum(i["cost_cents"] for i in items),
    }
