import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

E164_PATTERN = r"^\+[1-9]\d{1,14}$"


# ---------- Numbers ----------
class NumberProvisionRequest(BaseModel):
    area_code: str | None = Field(default=None, pattern=r"^\d{3}$")
    toll_free: bool = False


class NumberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    e164: str
    provider: str
    toll_free: bool
    status: str
    created_at: datetime.datetime


class NumberStatusUpdate(BaseModel):
    status: str  # pending_registration | active


# ---------- Contacts ----------
class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    phone_e164: str = Field(pattern=E164_PATTERN)
    email: EmailStr | None = None
    company: str | None = Field(default=None, max_length=200)
    tags: list[str] = Field(default_factory=list, max_length=20)


class ContactUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    email: EmailStr | None = None
    company: str | None = Field(default=None, max_length=200)
    tags: list[str] | None = Field(default=None, max_length=20)
    sms_opt_out: bool | None = None


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    phone_e164: str
    email: str | None
    company: str | None
    tags: list[str]
    sms_opt_out: bool
    source: str
    created_at: datetime.datetime


class ImportRequest(BaseModel):
    csv: str = Field(min_length=1, max_length=2_000_000)


class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[str]


# ---------- Conversations & messages ----------
class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    direction: str
    body: str
    media: list
    author: str
    provider_sid: str | None
    status: str
    error: str | None
    segments: int
    created_at: datetime.datetime


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    contact: ContactOut
    channel: str
    status: str
    assigned_to: str | None
    ai_enabled: bool
    last_message_at: datetime.datetime
    ai_summary: str | None
    created_at: datetime.datetime


class ConversationListItem(ConversationOut):
    last_message_preview: str = ""


class ThreadOut(ConversationOut):
    messages: list[MessageOut]


class SendMessageRequest(BaseModel):
    body: str = Field(min_length=1, max_length=1600)


class StartConversationRequest(BaseModel):
    contact_id: str
    body: str = Field(min_length=1, max_length=1600)


class ConversationPatch(BaseModel):
    status: str | None = None  # open | pending | closed
    assigned_to: str | None = None
    ai_enabled: bool | None = None


class AIDraftResponse(BaseModel):
    draft: str
    demo: bool


# ---------- Usage ----------
class UsageItem(BaseModel):
    kind: str
    quantity: int
    cost_cents: int


class UsageSummary(BaseModel):
    period_start: datetime.datetime
    period_end: datetime.datetime
    items: list[UsageItem]
    total_cost_cents: int


# ---------- Profile / settings ----------
class ProfileUpdate(BaseModel):
    business_name: str = Field(default="", max_length=200)
    business_profile: str = Field(default="", max_length=8000)
    ai_auto_reply: bool = True


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    business_name: str
    business_profile: str
    ai_auto_reply: bool
    updated_at: datetime.datetime
