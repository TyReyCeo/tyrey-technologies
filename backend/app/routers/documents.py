from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from .. import ai_engine
from ..database import get_db
from ..models import Document, User
from ..pdf_service import render_pdf
from ..schemas import DocumentOut, DocumentSummary, EditRequest
from ..security import get_current_user

router = APIRouter(tags=["documents"])


def _get_owned_document(document_id: str, user: User, db: Session) -> Document:
    doc = db.get(Document, document_id)
    if doc is None or doc.user_id != user.id:
        raise HTTPException(404, "Document not found")
    return doc


@router.get("/vault", response_model=list[DocumentSummary])
def vault(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Every saved deliverable across all of the user's projects."""
    return (
        db.query(Document)
        .filter(Document.user_id == user.id)
        .order_by(Document.created_at.desc())
        .all()
    )


@router.get("/documents/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_document(document_id, user, db)


@router.post("/documents/{document_id}/edit", response_model=DocumentOut)
def edit_document(
    document_id: str,
    req: EditRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = _get_owned_document(document_id, user, db)
    doc.content = ai_engine.edit_document(doc.content, req.instruction)
    doc.version += 1
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/documents/{document_id}/pdf")
def document_pdf(
    document_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = _get_owned_document(document_id, user, db)
    pdf_bytes = render_pdf(doc.title, doc.content)
    safe_name = doc.type.replace("_", "-")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="tyrey-{safe_name}.pdf"'},
    )
