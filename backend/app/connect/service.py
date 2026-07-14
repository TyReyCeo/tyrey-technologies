"""Connect business logic: sending, receiving, threading, and compliance.

Compliance rules live here — at the service layer, before any AI runs
(ARCHITECTURE.md §9): STOP/HELP/START keywords, `sms_opt_out` enforcement on
every outbound, and the registration gate on real (non-demo) sends.
"""

import datetime
import logging
import math
import time
from collections import defaultdict, deque

from sqlalchemy.orm import Session

from ..config import settings
from .models import ConnectNumber, ConnectProfile, Contact, Conversation, Message
from .providers import MessagingProvider
from . import usage

logger = logging.getLogger("tyrey.connect")

# TCPA/CTIA keyword sets, checked case-insensitively on the full trimmed body.
STOP_KEYWORDS = {"STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"}
START_KEYWORDS = {"START", "UNSTOP", "YES"}
HELP_KEYWORDS = {"HELP", "INFO"}

GSM_SINGLE_SEGMENT = 160
GSM_MULTI_SEGMENT = 153


class SendBlocked(Exception):
    """A compliance or policy rule blocked the send. Routers map this to 409."""


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def segment_count(body: str) -> int:
    """Rough GSM-7 segment estimate for usage metering."""
    if len(body) <= GSM_SINGLE_SEGMENT:
        return 1
    return math.ceil(len(body) / GSM_MULTI_SEGMENT)


# --- Rate limiting (in-memory, per user; §9 "rate limiting on send endpoints").
# Single-process MVP scope — revisit when the backend scales horizontally.
_send_times: dict[str, deque] = defaultdict(deque)


def check_send_rate(user_id: str) -> None:
    limit = settings.CONNECT_SEND_RATE_PER_MIN
    window = _send_times[user_id]
    now = time.monotonic()
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= limit:
        raise SendBlocked(f"Send rate limit reached ({limit}/min) — try again shortly")
    window.append(now)


def _keyword(body: str, keywords: set[str]) -> bool:
    return body.strip().upper() in keywords


def is_compliance_keyword(body: str) -> bool:
    """True when the body is a STOP/START/HELP keyword (never routed to AI)."""
    return _keyword(body, STOP_KEYWORDS | START_KEYWORDS | HELP_KEYWORDS)


def send_message(
    db: Session,
    provider: MessagingProvider,
    *,
    conversation: Conversation,
    body: str,
    author: str,  # user | ai
) -> Message:
    """Send an outbound SMS with every compliance gate applied."""
    contact = db.get(Contact, conversation.contact_id)
    number = db.get(ConnectNumber, conversation.number_id)

    if contact.sms_opt_out:
        raise SendBlocked("Contact has opted out of SMS (STOP). Sending is blocked.")
    # Registration gate: real carrier sends require an active (registered)
    # number; demo sends are exempt (ARCHITECTURE.md §9).
    if provider.name != "demo" and number.status != "active":
        raise SendBlocked(
            "This number is awaiting 10DLC/toll-free registration — real sends "
            "are blocked until registration is active."
        )

    result = provider.send_sms(
        from_number=number.e164, to_number=contact.phone_e164, body=body
    )
    message = Message(
        conversation_id=conversation.id,
        direction="out",
        body=body,
        author=author,
        provider_sid=result.provider_sid,
        status=result.status,
        segments=segment_count(body),
    )
    db.add(message)
    conversation.last_message_at = _now()
    db.flush()  # assign message.id for the usage record
    usage.record(
        db, user_id=conversation.user_id, kind="sms_out",
        quantity=message.segments, message_id=message.id,
    )
    logger.info(
        "connect send user=%s conversation=%s sid=%s status=%s segments=%d",
        conversation.user_id, conversation.id, result.provider_sid,
        result.status, message.segments,
    )
    return message


def get_or_create_contact(db: Session, *, user_id: str, phone_e164: str) -> Contact:
    contact = (
        db.query(Contact)
        .filter(Contact.user_id == user_id, Contact.phone_e164 == phone_e164)
        .first()
    )
    if contact is None:
        contact = Contact(
            user_id=user_id, name=phone_e164, phone_e164=phone_e164, source="inbound"
        )
        db.add(contact)
        db.flush()
    return contact


def get_or_create_conversation(
    db: Session, *, user_id: str, contact_id: str, number_id: str
) -> Conversation:
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.user_id == user_id,
            Conversation.contact_id == contact_id,
            Conversation.status != "closed",
        )
        .order_by(Conversation.last_message_at.desc())
        .first()
    )
    if conversation is None:
        conversation = Conversation(
            user_id=user_id, contact_id=contact_id, number_id=number_id
        )
        db.add(conversation)
        db.flush()
    return conversation


def handle_inbound(
    db: Session,
    provider: MessagingProvider,
    *,
    number: ConnectNumber,
    from_e164: str,
    body: str,
    provider_sid: str,
    media: list[str] | None = None,
) -> Message | None:
    """Store an inbound message; returns None if it was already processed
    (idempotent on provider_sid). Compliance keywords are handled here,
    before any AI sees the message."""
    existing = (
        db.query(Message).filter(Message.provider_sid == provider_sid).first()
    )
    if existing is not None:
        return None

    contact = get_or_create_contact(db, user_id=number.user_id, phone_e164=from_e164)
    conversation = get_or_create_conversation(
        db, user_id=number.user_id, contact_id=contact.id, number_id=number.id
    )
    message = Message(
        conversation_id=conversation.id,
        direction="in",
        body=body,
        media=media or [],
        author="contact",
        provider_sid=provider_sid,
        status="received",
        segments=segment_count(body),
    )
    db.add(message)
    conversation.status = "open" if conversation.status == "closed" else conversation.status
    conversation.last_message_at = _now()
    db.flush()
    usage.record(
        db, user_id=number.user_id, kind="mms_in" if media else "sms_in",
        quantity=message.segments, message_id=message.id,
    )

    # --- Compliance keywords (always processed, never routed to AI) ---
    if _keyword(body, STOP_KEYWORDS):
        contact.sms_opt_out = True
        contact.sms_opt_out_at = _now()
        logger.info("connect opt-out contact=%s user=%s", contact.id, number.user_id)
        # Carriers auto-acknowledge STOP; we must not send anything further.
        return message
    if _keyword(body, START_KEYWORDS) and contact.sms_opt_out:
        contact.sms_opt_out = False
        contact.sms_opt_out_at = None
        logger.info("connect opt-in contact=%s user=%s", contact.id, number.user_id)
        send_message(
            db, provider, conversation=conversation, author="ai",
            body="You are re-subscribed to messages. Reply STOP to unsubscribe, HELP for help.",
        )
        return message
    if _keyword(body, HELP_KEYWORDS):
        profile = (
            db.query(ConnectProfile)
            .filter(ConnectProfile.user_id == number.user_id)
            .first()
        )
        business = profile.business_name if profile and profile.business_name else "this business"
        send_message(
            db, provider, conversation=conversation, author="ai",
            body=f"You are messaging {business}. Reply STOP to unsubscribe.",
        )
        return message

    return message
