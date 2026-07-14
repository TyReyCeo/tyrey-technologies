"""Inbound provider webhooks — unauthenticated, signature-verified, idempotent.

Twilio (and the demo simulator) POST form-encoded payloads. Handlers dedupe
on provider_sid so carrier retries are safe. The AI auto-reply runs here,
after compliance keywords are handled, and only when both the per-customer
kill switch and the per-conversation `ai_enabled` flag allow it.
"""

import logging
from urllib.parse import parse_qsl

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from . import ai as connect_ai
from . import service
from .models import ConnectNumber, ConnectProfile, Message
from .providers import ProviderError, get_provider

logger = logging.getLogger("tyrey.connect.webhooks")
router = APIRouter(prefix="/connect/webhooks", tags=["connect-webhooks"])

TERMINAL_STATUSES = {"delivered", "failed", "undelivered"}


async def _verified_form(request: Request, provider_name: str) -> dict[str, str]:
    provider = get_provider()
    if provider.name != provider_name:
        raise HTTPException(404, "Provider not active")
    # Carriers POST application/x-www-form-urlencoded; parse with the stdlib
    # (starlette's form() would pull in python-multipart for nothing).
    raw = await request.body()
    form = dict(parse_qsl(raw.decode("utf-8"), keep_blank_values=True))
    if not provider.verify_webhook(
        url=str(request.url),
        headers={k.lower(): v for k, v in request.headers.items()},
        form=form,
    ):
        logger.warning("connect webhook rejected: bad signature provider=%s", provider_name)
        raise HTTPException(403, "Invalid webhook signature")
    return form


@router.post("/{provider_name}/inbound")
async def inbound(provider_name: str, request: Request, db: Session = Depends(get_db)):
    form = await _verified_form(request, provider_name)
    provider_sid = form.get("MessageSid", "")
    to_number = form.get("To", "")
    from_number = form.get("From", "")
    body = form.get("Body", "")
    if not provider_sid or not to_number or not from_number:
        raise HTTPException(400, "Missing MessageSid/To/From")

    number = (
        db.query(ConnectNumber)
        .filter(ConnectNumber.e164 == to_number, ConnectNumber.status != "released")
        .first()
    )
    if number is None:
        logger.warning("connect inbound for unknown number sid=%s", provider_sid)
        return {"status": "ignored"}

    media = [
        form[key]
        for i in range(int(form.get("NumMedia", "0") or 0))
        if (key := f"MediaUrl{i}") in form
    ]
    provider = get_provider()
    message = service.handle_inbound(
        db,
        provider,
        number=number,
        from_e164=from_number,
        body=body,
        provider_sid=provider_sid,
        media=media,
    )
    if message is None:
        db.commit()
        return {"status": "duplicate"}

    # AI receptionist auto-reply — only after compliance keywords passed
    # through (handle_inbound already replied and returned for STOP/HELP/START;
    # for those, message.contact is opted out or already answered).
    conversation = message.conversation
    if (
        message.status == "received"
        and not service.is_compliance_keyword(body)
        and conversation.ai_enabled
    ):
        profile = (
            db.query(ConnectProfile)
            .filter(ConnectProfile.user_id == number.user_id)
            .first()
        )
        if profile is None or profile.ai_auto_reply:
            try:
                reply_body, _demo = connect_ai.receptionist_reply(db, conversation)
                service.send_message(
                    db, provider, conversation=conversation, body=reply_body, author="ai"
                )
            except (service.SendBlocked, ProviderError) as exc:
                logger.warning(
                    "connect auto-reply skipped conversation=%s reason=%s",
                    conversation.id,
                    type(exc).__name__,
                )

    db.commit()
    return {"status": "received"}


@router.post("/{provider_name}/status")
async def status_callback(provider_name: str, request: Request, db: Session = Depends(get_db)):
    form = await _verified_form(request, provider_name)
    provider_sid = form.get("MessageSid", "")
    message_status = form.get("MessageStatus", "")
    if not provider_sid or not message_status:
        raise HTTPException(400, "Missing MessageSid/MessageStatus")

    message = db.query(Message).filter(Message.provider_sid == provider_sid).first()
    if message is None:
        return {"status": "ignored"}
    # Idempotent: never regress a terminal status on carrier retries.
    if message.status in TERMINAL_STATUSES:
        return {"status": "unchanged"}

    message.status = message_status
    if message_status in {"failed", "undelivered"}:
        message.error = form.get("ErrorCode") or "delivery failed"
    db.commit()
    return {"status": "updated"}
