"""Connect AI API surface (Phase 1) — see docs/connect-ai/ARCHITECTURE.md §5.

Every endpoint is authenticated, every query filters by user_id, every body
is validated. Plan gating: when Stripe is configured, Connect routes require
a Connect subscription; keyless dev mode stays fully usable (mirroring the
funnel's dev-mode fulfillment).
"""

import csv
import datetime
import io
import logging
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from ..security import get_current_user, require_admin
from . import ai as connect_ai
from . import service, usage
from .models import ConnectNumber, ConnectProfile, Contact, Conversation, Message
from .providers import get_provider
from .schemas import (
    AIDraftResponse,
    ContactCreate,
    ContactOut,
    ContactUpdate,
    ConversationListItem,
    ImportRequest,
    ConversationOut,
    ConversationPatch,
    ImportResult,
    NumberOut,
    NumberProvisionRequest,
    NumberStatusUpdate,
    ProfileOut,
    ProfileUpdate,
    SendMessageRequest,
    StartConversationRequest,
    ThreadOut,
    UsageSummary,
)

logger = logging.getLogger("tyrey.connect")
router = APIRouter(prefix="/connect", tags=["connect"])

CONNECT_PLANS = {"connect", "connect_executive"}
E164_RE = re.compile(r"^\+[1-9]\d{1,14}$")


def require_connect_plan(user: User = Depends(get_current_user)) -> User:
    """Plan gate. Active only when billing is configured — keyless dev mode
    stays open so demo mode works end to end (CLAUDE.md demo rule)."""
    if settings.STRIPE_SECRET_KEY and user.plan not in CONNECT_PLANS:
        raise HTTPException(
            402, "TyRey Connect AI requires a Connect subscription ($495/mo) or "
            "Connect Executive ($995/mo). Upgrade in Billing."
        )
    return user


# ---------- Numbers ----------


@router.post("/numbers", response_model=NumberOut)
def provision_number(
    req: NumberProvisionRequest,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    provider = get_provider()
    provisioned = provider.provision_number(
        area_code=req.area_code, toll_free=req.toll_free
    )
    number = ConnectNumber(
        user_id=user.id,
        e164=provisioned.e164,
        provider=provider.name,
        provider_sid=provisioned.provider_sid,
        toll_free=provisioned.toll_free,
        status=provisioned.status,
    )
    db.add(number)
    db.commit()
    db.refresh(number)
    return number


@router.get("/numbers", response_model=list[NumberOut])
def list_numbers(user: User = Depends(require_connect_plan), db: Session = Depends(get_db)):
    return (
        db.query(ConnectNumber)
        .filter(ConnectNumber.user_id == user.id, ConnectNumber.status != "released")
        .order_by(ConnectNumber.created_at.desc())
        .all()
    )


@router.delete("/numbers/{number_id}", response_model=NumberOut)
def release_number(
    number_id: str,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    number = db.get(ConnectNumber, number_id)
    if number is None or number.user_id != user.id or number.status == "released":
        raise HTTPException(404, "Number not found")
    get_provider().release_number(provider_sid=number.provider_sid)
    number.status = "released"
    db.commit()
    db.refresh(number)
    return number


@router.patch("/admin/numbers/{number_id}", response_model=NumberOut)
def admin_update_number_status(
    number_id: str,
    req: NumberStatusUpdate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin-only: flip a number's registration status once 10DLC/toll-free
    registration clears (see the registration runbook in docs/connect-ai/)."""
    if req.status not in {"pending_registration", "active"}:
        raise HTTPException(400, f"Invalid status '{req.status}'")
    number = db.get(ConnectNumber, number_id)
    if number is None or number.status == "released":
        raise HTTPException(404, "Number not found")
    number.status = req.status
    db.commit()
    db.refresh(number)
    return number


# ---------- Contacts ----------


def _get_owned_contact(contact_id: str, user: User, db: Session) -> Contact:
    contact = db.get(Contact, contact_id)
    if contact is None or contact.user_id != user.id:
        raise HTTPException(404, "Contact not found")
    return contact


@router.get("/contacts", response_model=list[ContactOut])
def list_contacts(
    query: str = "",
    tag: str = "",
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    q = db.query(Contact).filter(Contact.user_id == user.id)
    if query:
        like = f"%{query}%"
        q = q.filter(
            Contact.name.ilike(like)
            | Contact.phone_e164.ilike(like)
            | Contact.company.ilike(like)
        )
    contacts = q.order_by(Contact.created_at.desc()).offset(max(offset, 0)).limit(
        min(max(limit, 1), 500)
    ).all()
    if tag:
        contacts = [c for c in contacts if tag in (c.tags or [])]
    return contacts


@router.post("/contacts", response_model=ContactOut)
def create_contact(
    req: ContactCreate,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Contact)
        .filter(Contact.user_id == user.id, Contact.phone_e164 == req.phone_e164)
        .first()
    )
    if existing is not None:
        raise HTTPException(409, "A contact with that phone number already exists")
    contact = Contact(
        user_id=user.id,
        name=req.name,
        phone_e164=req.phone_e164,
        email=req.email,
        company=req.company,
        tags=req.tags,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.post("/contacts/import", response_model=ImportResult)
def import_contacts(
    req: ImportRequest,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    """CSV import. Body: {"csv": "name,phone,email,company\\n..."}. Rows are
    validated (E.164 phone required) and deduped against existing contacts."""
    reader = csv.DictReader(io.StringIO(req.csv))
    if not reader.fieldnames or "phone" not in [f.strip().lower() for f in reader.fieldnames]:
        raise HTTPException(400, "CSV must have a header row including a 'phone' column")

    existing_phones = {
        p for (p,) in db.query(Contact.phone_e164).filter(Contact.user_id == user.id)
    }
    imported, skipped, errors = 0, 0, []
    for line_no, row in enumerate(reader, start=2):
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
        phone = row.get("phone", "")
        if not E164_RE.match(phone):
            skipped += 1
            errors.append(f"Line {line_no}: invalid phone '{phone}' (must be E.164, e.g. +15551234567)")
            continue
        if phone in existing_phones:
            skipped += 1
            continue
        db.add(
            Contact(
                user_id=user.id,
                name=row.get("name") or phone,
                phone_e164=phone,
                email=row.get("email") or None,
                company=row.get("company") or None,
                source="import",
            )
        )
        existing_phones.add(phone)
        imported += 1
        if len(errors) > 50:
            errors.append("Too many errors — aborting import")
            break

    db.commit()
    return ImportResult(imported=imported, skipped=skipped, errors=errors[:50])


@router.patch("/contacts/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: str,
    req: ContactUpdate,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    contact = _get_owned_contact(contact_id, user, db)
    updates = req.model_dump(exclude_unset=True)
    if updates.pop("sms_opt_out", None) is not None:
        # Manual opt-out toggle is an explicit compliance action.
        contact.sms_opt_out = req.sms_opt_out
        contact.sms_opt_out_at = (
            datetime.datetime.now(datetime.timezone.utc) if req.sms_opt_out else None
        )
        logger.info(
            "connect manual opt-%s contact=%s user=%s",
            "out" if req.sms_opt_out else "in", contact.id, user.id,
        )
    for field, value in updates.items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}")
def delete_contact(
    contact_id: str,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    contact = _get_owned_contact(contact_id, user, db)
    has_conversations = (
        db.query(Conversation).filter(Conversation.contact_id == contact.id).first()
        is not None
    )
    if has_conversations:
        raise HTTPException(
            409, "Contact has conversation history — close the conversations instead"
        )
    db.delete(contact)
    db.commit()
    return {"status": "deleted"}


# ---------- Conversations ----------


def _get_owned_conversation(conversation_id: str, user: User, db: Session) -> Conversation:
    conversation = db.get(Conversation, conversation_id)
    if conversation is None or conversation.user_id != user.id:
        raise HTTPException(404, "Conversation not found")
    return conversation


@router.get("/conversations", response_model=list[ConversationListItem])
def list_conversations(
    status: str = "",
    limit: int = 50,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    q = db.query(Conversation).filter(Conversation.user_id == user.id)
    if status:
        q = q.filter(Conversation.status == status)
    conversations = (
        q.order_by(Conversation.last_message_at.desc())
        .limit(min(max(limit, 1), 200))
        .all()
    )
    ids = [c.id for c in conversations]
    previews: dict[str, str] = {}
    if ids:
        for m in (
            db.query(Message)
            .filter(Message.conversation_id.in_(ids))
            .order_by(Message.created_at.asc())
        ):
            previews[m.conversation_id] = m.body
    items = []
    for c in conversations:
        item = ConversationListItem.model_validate(c)
        item.last_message_preview = previews.get(c.id, "")[:120]
        items.append(item)
    return items


@router.post("/conversations", response_model=ThreadOut)
def start_conversation(
    req: StartConversationRequest,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    """Start (or continue) an outbound thread with a contact."""
    contact = _get_owned_contact(req.contact_id, user, db)
    number = (
        db.query(ConnectNumber)
        .filter(ConnectNumber.user_id == user.id, ConnectNumber.status != "released")
        .order_by(ConnectNumber.created_at.desc())
        .first()
    )
    if number is None:
        raise HTTPException(409, "Provision a phone number first")
    _rate_limit(user.id)
    conversation = service.get_or_create_conversation(
        db, user_id=user.id, contact_id=contact.id, number_id=number.id
    )
    _send_or_409(db, conversation, req.body, author="user")
    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("/conversations/{conversation_id}", response_model=ThreadOut)
def get_thread(
    conversation_id: str,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    return _get_owned_conversation(conversation_id, user, db)


@router.post("/conversations/{conversation_id}/messages", response_model=ThreadOut)
def send_reply(
    conversation_id: str,
    req: SendMessageRequest,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    conversation = _get_owned_conversation(conversation_id, user, db)
    _rate_limit(user.id)
    _send_or_409(db, conversation, req.body, author="user")
    db.commit()
    db.refresh(conversation)
    return conversation


@router.patch("/conversations/{conversation_id}", response_model=ConversationOut)
def update_conversation(
    conversation_id: str,
    req: ConversationPatch,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    conversation = _get_owned_conversation(conversation_id, user, db)
    updates = req.model_dump(exclude_unset=True)
    if "status" in updates and updates["status"] not in {"open", "pending", "closed"}:
        raise HTTPException(400, f"Invalid status '{updates['status']}'")
    for field, value in updates.items():
        setattr(conversation, field, value)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.post("/conversations/{conversation_id}/ai-draft", response_model=AIDraftResponse)
def ai_draft(
    conversation_id: str,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    """AI-drafted reply for human review — returns the draft; sending stays
    an explicit, separate action (insert-to-edit in the inbox UI)."""
    conversation = _get_owned_conversation(conversation_id, user, db)
    draft, demo = connect_ai.draft_reply(db, conversation)
    return AIDraftResponse(draft=draft, demo=demo)


@router.post("/conversations/{conversation_id}/summarize", response_model=ConversationOut)
def summarize_conversation(
    conversation_id: str,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    conversation = _get_owned_conversation(conversation_id, user, db)
    if not conversation.messages:
        raise HTTPException(409, "Nothing to summarize yet")
    conversation.ai_summary = connect_ai.summarize(db, conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


# ---------- Usage ----------


@router.get("/usage/summary", response_model=UsageSummary)
def usage_summary(user: User = Depends(require_connect_plan), db: Session = Depends(get_db)):
    return usage.summary(db, user.id)


# ---------- Profile / settings ----------


@router.get("/profile", response_model=ProfileOut)
def get_profile(user: User = Depends(require_connect_plan), db: Session = Depends(get_db)):
    profile = (
        db.query(ConnectProfile).filter(ConnectProfile.user_id == user.id).first()
    )
    if profile is None:
        profile = ConnectProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("/profile", response_model=ProfileOut)
def update_profile(
    req: ProfileUpdate,
    user: User = Depends(require_connect_plan),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(ConnectProfile).filter(ConnectProfile.user_id == user.id).first()
    )
    if profile is None:
        profile = ConnectProfile(user_id=user.id)
        db.add(profile)
    profile.business_name = req.business_name
    profile.business_profile = req.business_profile
    profile.ai_auto_reply = req.ai_auto_reply
    db.commit()
    db.refresh(profile)
    return profile


# ---------- Helpers ----------


def _rate_limit(user_id: str) -> None:
    try:
        service.check_send_rate(user_id)
    except service.SendBlocked as exc:
        raise HTTPException(429, str(exc))


def _send_or_409(db: Session, conversation: Conversation, body: str, *, author: str) -> Message:
    try:
        return service.send_message(
            db, get_provider(), conversation=conversation, body=body, author=author
        )
    except service.SendBlocked as exc:
        db.rollback()
        raise HTTPException(409, str(exc))
