"""Connect AI Phase 1 — numbers, contacts, conversations, messages, usage, profiles.

Matches app/connect/models.py. See docs/connect-ai/ARCHITECTURE.md §4.

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-13
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "connect_numbers",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("e164", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("provider_sid", sa.String(), nullable=False),
        sa.Column("toll_free", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_connect_numbers_user_id", "connect_numbers", ["user_id"])
    op.create_index("ix_connect_numbers_e164", "connect_numbers", ["e164"])

    op.create_table(
        "connect_contacts",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("phone_e164", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("company", sa.String(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("sms_opt_out", sa.Boolean(), nullable=False),
        sa.Column("sms_opt_out_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "phone_e164", name="uq_contact_user_phone"),
    )
    op.create_index("ix_connect_contacts_user_id", "connect_contacts", ["user_id"])
    op.create_index("ix_connect_contacts_phone_e164", "connect_contacts", ["phone_e164"])

    op.create_table(
        "connect_conversations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("contact_id", sa.String(), sa.ForeignKey("connect_contacts.id"), nullable=False),
        sa.Column("channel", sa.String(), nullable=False),
        sa.Column("number_id", sa.String(), sa.ForeignKey("connect_numbers.id"), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("assigned_to", sa.String(), nullable=True),
        sa.Column("ai_enabled", sa.Boolean(), nullable=False),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_connect_conversations_user_id", "connect_conversations", ["user_id"])
    op.create_index("ix_connect_conversations_contact_id", "connect_conversations", ["contact_id"])
    op.create_index(
        "ix_conversations_user_last_message",
        "connect_conversations",
        ["user_id", "last_message_at"],
    )

    op.create_table(
        "connect_messages",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("conversation_id", sa.String(), sa.ForeignKey("connect_conversations.id"), nullable=False),
        sa.Column("direction", sa.String(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("media", sa.JSON(), nullable=False),
        sa.Column("author", sa.String(), nullable=False),
        sa.Column("provider_sid", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("segments", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_connect_messages_provider_sid", "connect_messages", ["provider_sid"])
    op.create_index(
        "ix_messages_conversation_created",
        "connect_messages",
        ["conversation_id", "created_at"],
    )

    op.create_table(
        "connect_usage_records",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_cost_cents", sa.Integer(), nullable=False),
        sa.Column("message_id", sa.String(), sa.ForeignKey("connect_messages.id"), nullable=True),
        sa.Column("stripe_reported", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_connect_usage_records_user_id", "connect_usage_records", ["user_id"])

    op.create_table(
        "connect_profiles",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("business_name", sa.String(), nullable=False),
        sa.Column("business_profile", sa.Text(), nullable=False),
        sa.Column("ai_auto_reply", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_connect_profiles_user_id", "connect_profiles", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_table("connect_profiles")
    op.drop_table("connect_usage_records")
    op.drop_table("connect_messages")
    op.drop_table("connect_conversations")
    op.drop_table("connect_contacts")
    op.drop_table("connect_numbers")
