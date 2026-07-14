import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .connect import router as connect_router
from .connect import webhooks as connect_webhooks
from .connect.providers import ProviderError
from .database import init_db
from .llm import LLMError
from .routers import admin, auth, billing, documents, funnel, leads, projects

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
    allow_origins=[
        settings.FRONTEND_URL,
        "https://tyreytechnologies.com",
        "https://www.tyreytechnologies.com",
        "https://tyrey-intelligence.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(LLMError)
def llm_error_handler(request: Request, exc: LLMError):
    # Defined user-facing failure for AI workflows (provider already retried).
    return JSONResponse(
        status_code=502,
        content={"detail": "AI generation is temporarily unavailable. Please try again."},
    )


@app.exception_handler(ProviderError)
def provider_error_handler(request: Request, exc: ProviderError):
    # Carrier failures surface as a clean 502, same pattern as LLMError.
    return JSONResponse(status_code=502, content={"detail": str(exc)})


app.include_router(funnel.router)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(documents.router)
app.include_router(billing.router)
app.include_router(leads.router)
app.include_router(admin.router)
app.include_router(connect_router.router)
app.include_router(connect_webhooks.router)

init_db()


@app.get("/")
def health():
    return {"service": "TyRey Intelligence API", "status": "ok"}
