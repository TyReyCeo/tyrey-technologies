import datetime
import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    plan: Mapped[str] = mapped_column(String, default="free")  # free | starter | pro | executive
    stripe_customer_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now)

    projects: Mapped[list["Project"]] = relationship(back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    objective: Mapped[str] = mapped_column(String)  # start_company | raise_capital | acquire_business | ...
    industry: Mapped[str] = mapped_column(String)
    stage: Mapped[str] = mapped_column(String)  # idea | early | growth
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped["User"] = relationship(back_populates="projects")
    documents: Mapped[list["Document"]] = relationship(back_populates="project")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(String, ForeignKey("projects.id"), index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(String)  # framework name, e.g. business_plan
    title: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(Text)  # markdown
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    project: Mapped["Project"] = relationship(back_populates="documents")


class Order(Base):
    """A one-time funnel purchase (Phase 8: idea -> preview -> paywall -> pack)."""

    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    email: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    idea: Mapped[str] = mapped_column(Text)
    industry: Mapped[str] = mapped_column(String)
    stage: Mapped[str] = mapped_column(String)
    tier: Mapped[str] = mapped_column(String)  # starter | investor | founder
    amount: Mapped[int] = mapped_column(Integer)  # cents
    status: Mapped[str] = mapped_column(String, default="pending")  # pending | paid | generated | failed
    stripe_session_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)  # the generated pack (markdown)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=_now)
