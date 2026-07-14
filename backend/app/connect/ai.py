"""Conversation-AI orchestration for Connect.

Builds engine inputs (thread transcript, contact record, business profile)
and parses structured output. Everything goes through ai_engine with a
framework JSON — never a freeform prompt, never a direct llm.py call.
Demo mode returns short, clearly-labeled sample replies (a full framework
demo document would be nonsense as an SMS body).
"""

import logging
import re

from sqlalchemy.orm import Session

from .. import ai_engine
from ..config import settings
from .models import ConnectProfile, Contact, Conversation

logger = logging.getLogger("tyrey.connect.ai")

TRANSCRIPT_MESSAGE_LIMIT = 30
AI_LABEL_MAX_BODY = 1200  # leave room within the 1600-char send cap


def _profile(db: Session, user_id: str) -> ConnectProfile | None:
    return db.query(ConnectProfile).filter(ConnectProfile.user_id == user_id).first()


def _transcript(db: Session, conversation: Conversation) -> str:
    lines = []
    for m in conversation.messages[-TRANSCRIPT_MESSAGE_LIMIT:]:
        speaker = {"contact": "Customer", "user": "Business", "ai": "Business (AI)"}[m.author]
        lines.append(f"{speaker}: {m.body}")
    return "\n".join(lines)


def _context(db: Session, conversation: Conversation) -> dict[str, str]:
    contact = db.get(Contact, conversation.contact_id)
    profile = _profile(db, conversation.user_id)
    return {
        "business_name": (profile.business_name if profile else "") or "the business",
        "business_profile": (profile.business_profile if profile else "")
        or "No business profile provided.",
        "contact_name": contact.name,
        "contact_company": contact.company or "",
        "conversation_transcript": _transcript(db, conversation),
    }


def _extract_section(content: str, heading: str) -> str:
    """Pull one framework section's body out of the generated markdown."""
    match = re.search(
        rf"^##\s*{re.escape(heading)}\s*$(.*?)(?=^##\s|\Z)",
        content,
        re.MULTILINE | re.DOTALL,
    )
    return match.group(1).strip() if match else content.strip()


def draft_reply(db: Session, conversation: Conversation) -> tuple[str, bool]:
    """Draft a reply for human review. Returns (draft, is_demo)."""
    if not settings.ANTHROPIC_API_KEY:
        contact = db.get(Contact, conversation.contact_id)
        return (
            f"[Demo draft] Hi {contact.name.split()[0]}, thanks for reaching out! "
            "Happy to help with that — what works best for you? "
            "(Connect an ANTHROPIC_API_KEY for real AI drafts.)",
            True,
        )
    content = ai_engine.generate("connect_reply_draft", _context(db, conversation))
    return _extract_section(content, "Reply")[:AI_LABEL_MAX_BODY], False


def receptionist_reply(db: Session, conversation: Conversation) -> tuple[str, bool]:
    """First-touch auto-reply from the AI receptionist. Returns (body, is_demo)."""
    if not settings.ANTHROPIC_API_KEY:
        profile = _profile(db, conversation.user_id)
        business = (profile.business_name if profile else "") or "our team"
        return (
            f"Thanks for reaching out to {business}! This is our AI assistant "
            "(demo mode). A team member will follow up shortly. "
            "Reply STOP to unsubscribe.",
            True,
        )
    content = ai_engine.generate("connect_receptionist", _context(db, conversation))
    return _extract_section(content, "Reply")[:AI_LABEL_MAX_BODY], False


def summarize(db: Session, conversation: Conversation) -> str:
    """Thread summary + sentiment + next action, stored on ai_summary."""
    if not settings.ANTHROPIC_API_KEY:
        return (
            "**Demo summary.** Connect an ANTHROPIC_API_KEY for real thread "
            "summaries with sentiment and suggested next actions."
        )
    return ai_engine.generate("connect_summarize", _context(db, conversation))
