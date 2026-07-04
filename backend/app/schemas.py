import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------- Auth ----------
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str
    user_id: str
    email: str
    plan: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    plan: str
    created_at: datetime.datetime


# ---------- Projects ----------
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    objective: str
    industry: str
    stage: str
    notes: str | None = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    objective: str
    industry: str
    stage: str
    notes: str | None
    created_at: datetime.datetime


class GenerateRequest(BaseModel):
    module: str  # framework name, e.g. business_plan, business_genome


# ---------- Documents ----------
class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    type: str
    title: str
    content: str
    version: int
    created_at: datetime.datetime
    updated_at: datetime.datetime


class DocumentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    type: str
    title: str
    version: int
    created_at: datetime.datetime


class EditRequest(BaseModel):
    instruction: str = Field(min_length=1)


# ---------- Funnel ----------
class PreviewRequest(BaseModel):
    idea: str = Field(min_length=10, max_length=5000)
    industry: str = Field(min_length=1, max_length=120)
    stage: str = Field(min_length=1, max_length=60)


class PreviewResponse(BaseModel):
    content: str


class CheckoutRequest(BaseModel):
    idea: str = Field(min_length=10, max_length=5000)
    industry: str
    stage: str
    tier: str = "investor"  # starter | investor | founder
    email: EmailStr | None = None


class CheckoutResponse(BaseModel):
    url: str
    order_id: str


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tier: str
    status: str
    content: str | None
    created_at: datetime.datetime


# ---------- Billing ----------
class SubscribeRequest(BaseModel):
    plan: str  # starter | pro | executive
