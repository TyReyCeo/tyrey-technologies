import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import auth, billing, documents, funnel, leads, projects

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="TyRey Intelligence™ API",
    description=(
        "AI-powered strategic advisory platform by TyRey Technologies, Inc. "
        "Outputs are planning tools, not guarantees of business success or "
        "financial/legal advice."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(funnel.router)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(documents.router)
app.include_router(billing.router)
app.include_router(leads.router)

init_db()


@app.get("/")
def health():
    return {"service": "TyRey Intelligence API", "status": "ok"}
