from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import ai_engine
from ..database import get_db
from ..frameworks import framework_names, list_frameworks, load_framework
from ..models import Document, Project, User
from ..schemas import DocumentOut, GenerateRequest, ProjectCreate, ProjectOut
from ..security import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


def _get_owned_project(project_id: str, user: User, db: Session) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.user_id != user.id:
        raise HTTPException(404, "Project not found")
    return project


@router.post("", response_model=ProjectOut)
def create_project(
    req: ProjectCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = Project(
        user_id=user.id,
        name=req.name,
        objective=req.objective,
        industry=req.industry,
        stage=req.stage,
        notes=req.notes,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectOut])
def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Project)
        .filter(Project.user_id == user.id)
        .order_by(Project.created_at.desc())
        .all()
    )


@router.get("/modules")
def modules():
    """The intelligence module catalog (framework IP library). Connect AI's
    conversation frameworks are internal to /connect and excluded here."""
    return [f for f in list_frameworks() if f["category"] != "connect"]


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_project(project_id, user, db)


@router.get("/{project_id}/documents", response_model=list[DocumentOut])
def project_documents(
    project_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = _get_owned_project(project_id, user, db)
    return (
        db.query(Document)
        .filter(Document.project_id == project.id)
        .order_by(Document.created_at.desc())
        .all()
    )


@router.post("/{project_id}/generate", response_model=DocumentOut)
def generate(
    project_id: str,
    req: GenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = _get_owned_project(project_id, user, db)
    if req.module not in framework_names() or load_framework(req.module)["category"] == "connect":
        raise HTTPException(400, f"Unknown module '{req.module}'")

    content = ai_engine.generate(
        req.module,
        {
            "project_name": project.name,
            "objective": project.objective,
            "industry": project.industry,
            "stage": project.stage,
            "notes": project.notes or "",
        },
    )

    framework = load_framework(req.module)
    version = (
        db.query(Document)
        .filter(Document.project_id == project.id, Document.type == req.module)
        .count()
        + 1
    )
    doc = Document(
        project_id=project.id,
        user_id=user.id,
        type=req.module,
        title=f"{framework['title']} — {project.name}",
        content=content,
        version=version,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc
