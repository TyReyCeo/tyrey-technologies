"""End-to-end smoke test of the TyRey backend in demo mode (no API keys needed).

Run from the backend/ directory:  python tests/smoke_test.py
Covers: funnel (preview -> checkout -> order -> PDF), auth, projects,
module generation, vault, Edit-with-AI, PDF export, ownership isolation.
"""

import os
import sys
import tempfile
from pathlib import Path

os.chdir(tempfile.mkdtemp(prefix="tyrey-smoke-"))  # sqlite db lands here
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
failures = []


def check(name, cond, detail=""):
    status = "PASS" if cond else "FAIL"
    print(f"[{status}] {name} {detail}")
    if not cond:
        failures.append(name)


# Health
r = client.get("/")
check("health", r.status_code == 200, r.text[:100])

# --- Funnel (Phase 8) ---
r = client.post("/funnel/preview", json={
    "idea": "An AI platform that helps small towns attract investment",
    "industry": "Economic development", "stage": "idea"})
check("funnel preview", r.status_code == 200 and "DEMO MODE" in r.json()["content"])

r = client.post("/funnel/checkout", json={
    "idea": "An AI platform that helps small towns attract investment",
    "industry": "Economic development", "stage": "idea",
    "tier": "investor", "email": "buyer@example.com"})
check("funnel checkout (dev mode)", r.status_code == 200, str(r.json())[:120])
order_id = r.json()["order_id"]

r = client.get(f"/funnel/order/{order_id}")
check("order generated", r.status_code == 200 and r.json()["status"] == "generated")

r = client.get(f"/funnel/order/{order_id}/pdf")
check("order pdf", r.status_code == 200 and r.content[:4] == b"%PDF",
      f"{len(r.content)} bytes")

# --- Auth ---
r = client.post("/auth/signup", json={"email": "founder@tyrey.com", "password": "secret123"})
check("signup", r.status_code == 200)
token = r.json()["token"]
hdr = {"Authorization": f"Bearer {token}"}

r = client.post("/auth/login", json={"email": "founder@tyrey.com", "password": "wrong-pass"})
check("login rejects bad password", r.status_code == 401)

r = client.post("/auth/login", json={"email": "founder@tyrey.com", "password": "secret123"})
check("login", r.status_code == 200)

r = client.get("/auth/me", headers=hdr)
check("me", r.status_code == 200 and r.json()["email"] == "founder@tyrey.com")

r = client.get("/auth/me")
check("me requires auth", r.status_code == 401)

# --- Projects ---
r = client.get("/projects/modules")
check("module catalog has 11 frameworks", r.status_code == 200 and len(r.json()) == 11)

r = client.post("/projects", headers=hdr, json={
    "name": "Perry Pivot", "objective": "start_company",
    "industry": "Community investment", "stage": "idea", "notes": "Small-town venture fund"})
check("create project", r.status_code == 200)
project_id = r.json()["id"]

r = client.get("/projects", headers=hdr)
check("list projects", r.status_code == 200 and len(r.json()) == 1)

r = client.post(f"/projects/{project_id}/generate", headers=hdr, json={"module": "business_genome"})
check("generate business_genome", r.status_code == 200 and "Business Genome" in r.json()["title"])
doc_id = r.json()["id"]

r = client.post(f"/projects/{project_id}/generate", headers=hdr, json={"module": "not_a_module"})
check("generate rejects unknown module", r.status_code == 400)

# --- Documents / Vault ---
r = client.get("/vault", headers=hdr)
check("vault", r.status_code == 200 and len(r.json()) == 1)

r = client.post(f"/documents/{doc_id}/edit", headers=hdr, json={"instruction": "Make it shorter"})
check("edit with AI (demo)", r.status_code == 200 and r.json()["version"] == 2)

r = client.get(f"/documents/{doc_id}/pdf", headers=hdr)
check("document pdf", r.status_code == 200 and r.content[:4] == b"%PDF")

# Ownership isolation
r2 = client.post("/auth/signup", json={"email": "other@tyrey.com", "password": "secret123"})
hdr2 = {"Authorization": f"Bearer {r2.json()['token']}"}
r = client.get(f"/documents/{doc_id}", headers=hdr2)
check("cross-user document access blocked", r.status_code == 404)

# --- Billing (unconfigured -> 503) ---
r = client.post("/billing/subscribe", headers=hdr, json={"plan": "pro"})
check("billing 503 when unconfigured", r.status_code == 503)

print()
if failures:
    print(f"{len(failures)} FAILURES: {failures}")
    sys.exit(1)
print("ALL CHECKS PASSED")
