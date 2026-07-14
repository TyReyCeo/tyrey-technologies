import datetime
import uuid

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


class ConnectNumber(Base):
    """A phone number provisioned for a customer (demo or carrier-backed).

    `status` doubles as the compliance gate: real (non-demo) sends are blocked
    until 10DLC/toll-free registration completes and the number is `active`.
    Demo numbers are born active.
    """

    __tablename__ = "connect_numbers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    e164: Mapped[str] = mapped_column(String, index=True)
    provider: Mapped[str] = mapped_column(String)  # demo | twilio
    provider_sid: Mapped[str] = mapped_column(String)
    toll_free: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String, default="pending_registration")  # pending_registration | active | released
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Contact(Base):
    __tablename__ = "connect_contacts"
    __table_args__ = (UniqueConstraint("user_id", "phone_e164", name="uq_contact_user_phone"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    phone_e164: Mapped[str] = mapped_column(String, index=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    company: Mapped[str | None] = mapped_column(String, nullable=True)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    sms_opt_out: Mapped[bool] = mapped_column(Boolean, default=False)
    sms_opt_out_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    source: Mapped[str] = mapped_column(String, default="manual")  # manual | import | inbound
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class Conversation(Base):
    __tablename__ = "connect_conversations"
    __table_args__ = (Index("ix_conversations_user_last_message", "user_id", "last_message_at"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    contact_id: Mapped[str] = mapped_column(String, ForeignKey("connect_contacts.id"), index=True)
    channel: Mapped[str] = mapped_column(String, default="sms")
    number_id: Mapped[str] = mapped_column(String, ForeignKey("connect_numbers.id"))
    status: Mapped[str] = mapped_column(String, default="open")  # open | pending | closed
    assigned_to: Mapped[str | None] = mapped_column(String, nullable=True)
    ai_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    last_message_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now)

    contact: Mapped["Contact"] = relationship()
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", order_by="Message.created_at"
    )


class Message(Base):
    __tablename__ = "connect_messages"
    __table_args__ = (Index("ix_messages_conversation_created", "conversation_id", "created_at"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("connect_conversations.id"))
    direction: Mapped[str] = mapped_column(String)  # in | out
    body: Mapped[str] = mapped_column(Text)
    media: Mapped[list] = mapped_column(JSON, default=list)
    author: Mapped[str] = mapped_column(String)  # contact | user | ai
    provider_sid: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String)  # queued | sent | delivered | failed | simulated | received
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    segments: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


class UsageRecord(Base):
    __tablename__ = "connect_usage_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(String)  # sms_out | sms_in | mms_out | mms_in
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_cost_cents: Mapped[int] = mapped_column(Integer, default=0)
    message_id: Mapped[str | None] = mapped_column(String, ForeignKey("connect_messages.id"), nullable=True)
    stripe_reported: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now)


class ConnectProfile(Base):
    """Per-customer Connect settings: the business profile that feeds the AI
    receptionist, plus the global auto-reply kill switch (risk item 3 in the
    roadmap — per-conversation `ai_enabled` gates individually)."""

    __tablename__ = "connect_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, index=True)
    business_name: Mapped[str] = mapped_column(String, default="")
    business_profile: Mapped[str] = mapped_column(Text, default="")
    ai_auto_reply: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)
