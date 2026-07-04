"""Shared pytest fixtures.

The env overrides MUST happen before any `app.*` import: config.Settings()
reads the environment at import time, and database.py builds the engine from
it. Environment variables take priority over backend/.env, so a developer's
local keys never leak into a test run — every test executes in demo mode
against a throwaway SQLite database.
"""

import os
import tempfile

_db_dir = tempfile.mkdtemp(prefix="tyrey-test-").replace(os.sep, "/")
os.environ["DATABASE_URL"] = f"sqlite:///{_db_dir}/test.db"
os.environ["ANTHROPIC_API_KEY"] = ""  # demo mode — no model calls
os.environ["STRIPE_SECRET_KEY"] = ""  # dev-mode checkout — instant fulfillment
os.environ["STRIPE_WEBHOOK_SECRET"] = ""
os.environ["ADMIN_EMAILS"] = "admin@tyrey.com"

import pytest
from fastapi.testclient import TestClient


def signup(client: TestClient, email: str, password: str = "secret123") -> dict:
    """Create a user and return their auth headers."""
    r = client.post("/auth/signup", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="session")
def client() -> TestClient:
    from app.main import app

    return TestClient(app)


@pytest.fixture(scope="session")
def auth_headers(client: TestClient) -> dict:
    return signup(client, "founder@tyrey.com")


@pytest.fixture(scope="session")
def project_id(client: TestClient, auth_headers: dict) -> str:
    r = client.post(
        "/projects",
        headers=auth_headers,
        json={
            "name": "Perry Pivot",
            "objective": "start_company",
            "industry": "Community investment",
            "stage": "idea",
            "notes": "Small-town venture fund",
        },
    )
    assert r.status_code == 200, r.text
    return r.json()["id"]


@pytest.fixture(scope="session")
def document(client: TestClient, auth_headers: dict, project_id: str) -> dict:
    r = client.post(
        f"/projects/{project_id}/generate",
        headers=auth_headers,
        json={"module": "business_genome"},
    )
    assert r.status_code == 200, r.text
    return r.json()
