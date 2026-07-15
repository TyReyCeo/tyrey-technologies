"""Stripe subscription webhook -> User.plan sync.

Pure DB tests exercising ``_sync_subscription_from_event`` directly — no Stripe
network calls and no signature verification. Covers the entitlement sync that
``checkout.session.completed`` doesn't: portal-initiated plan switches,
cancellations, and payment-failure status changes.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base
from app.models import User
from app.routers.funnel import _sync_subscription_from_event


@pytest.fixture()
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


@pytest.fixture(autouse=True)
def price_config():
    """Point the plan map at known price IDs for the duration of a test."""
    old = (settings.STRIPE_PRICE_CONNECT, settings.STRIPE_PRICE_CONNECT_EXECUTIVE)
    settings.STRIPE_PRICE_CONNECT = "price_connect"
    settings.STRIPE_PRICE_CONNECT_EXECUTIVE = "price_connect_exec"
    yield
    settings.STRIPE_PRICE_CONNECT, settings.STRIPE_PRICE_CONNECT_EXECUTIVE = old


def make_user(db, plan="free", customer="cus_1"):
    user = User(email="u@example.com", hashed_password="x", plan=plan, stripe_customer_id=customer)
    db.add(user)
    db.commit()
    return user


def event(event_type="customer.subscription.created", customer="cus_1", price="price_connect", status="active"):
    return {
        "type": event_type,
        "data": {"object": {
            "customer": customer,
            "status": status,
            "items": {"data": [{"price": {"id": price}}]},
        }},
    }


def test_created_sets_plan(db):
    user = make_user(db)
    _sync_subscription_from_event(event(), db)
    assert user.plan == "connect"


def test_replay_is_idempotent(db):
    user = make_user(db)
    _sync_subscription_from_event(event(), db)
    _sync_subscription_from_event(event(), db)
    assert user.plan == "connect"


def test_updated_switches_plan(db):
    user = make_user(db, plan="connect")
    _sync_subscription_from_event(
        event("customer.subscription.updated", price="price_connect_exec"), db
    )
    assert user.plan == "connect_executive"


def test_deleted_downgrades_to_free(db):
    user = make_user(db, plan="connect_executive")
    _sync_subscription_from_event(
        event("customer.subscription.deleted", status="canceled"), db
    )
    assert user.plan == "free"


def test_unentitled_status_downgrades_to_free(db):
    user = make_user(db, plan="connect")
    _sync_subscription_from_event(
        event("customer.subscription.updated", status="unpaid"), db
    )
    assert user.plan == "free"


def test_past_due_keeps_plan(db):
    user = make_user(db, plan="connect")
    _sync_subscription_from_event(
        event("customer.subscription.updated", status="past_due"), db
    )
    assert user.plan == "connect"


def test_unknown_customer_is_ignored(db):
    user = make_user(db, customer="cus_other")
    _sync_subscription_from_event(event(customer="cus_unknown"), db)
    assert user.plan == "free"


def test_unmapped_price_keeps_current_plan(db):
    # An entitled subscription on a price we don't recognize must NOT downgrade
    # a paying customer — it means our env vars drifted from Stripe.
    user = make_user(db, plan="connect")
    _sync_subscription_from_event(
        event("customer.subscription.updated", price="price_mystery"), db
    )
    assert user.plan == "connect"
