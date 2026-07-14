"""Lead capture from the marketing site's service pages.

POST  /leads       — public, called by the LeadForm on each service page.
GET   /leads       — admin-only (ADMIN_EMAILS), list captured leads (newest first).
PATCH /leads/{id}  — admin-only, move a lead through the pipeline.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Lead, User
from ..schemas import LeadCreate, LeadOut, LeadStatusUpdate
from ..security import require_admin

router = APIRouter(prefix="/leads", tags=["leads"])

VALID_SERVICES = {
    "due-diligence-studio",
    "acquisition-scout",
    "ceo-in-a-box",
    "connect-ai",
    "general",
}
LEAD_STATUSES = {"new", "contacted", "qualified", "won", "lost"}


@router.post("", response_model=LeadOut)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    if payload.service not in VALID_SERVICES:
        raise HTTPException(status_code=400, detail="Unknown service")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    lead = Lead(
        service=payload.service,
        name=payload.name.strip(),
        email=payload.email,
        company=payload.company.strip(),
        message=payload.message.strip()[:5000],
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("", response_model=list[LeadOut])
def list_leads(
    db: Session = Depends(get_db), user: User = Depends(require_admin)
):
    return db.query(Lead).order_by(Lead.created_at.desc()).all()


@router.patch("/{lead_id}", response_model=LeadOut)
def update_lead_status(
    lead_id: str,
    req: LeadStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    if req.status not in LEAD_STATUSES:
        raise HTTPException(400, f"Invalid status '{req.status}'")
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(404, "Lead not found")
    lead.status = req.status
    db.commit()
    db.refresh(lead)
    return lead
