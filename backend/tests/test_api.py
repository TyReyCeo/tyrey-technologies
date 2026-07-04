"""End-to-end API suite, demo mode (no keys required).

Covers everything the original smoke script did — funnel (preview → checkout
→ order → PDF), auth, projects, module generation, vault, Edit-with-AI, PDF
export, ownership isolation — plus the admin gate on lead listing and Stripe
subscription plan activation/downgrade via webhook.
"""

from conftest import signup

IDEA = "An AI platform that helps small towns attract investment"


def test_health(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# --- Funnel (one-time packs) ---

def test_funnel_preview_demo_mode(client):
    r = client.post(
        "/funnel/preview",
        json={"idea": IDEA, "industry": "Economic development", "stage": "idea"},
    )
    assert r.status_code == 200
    assert "DEMO MODE" in r.json()["content"]


def test_funnel_checkout_fulfills_in_dev_mode(client):
    r = client.post(
        "/funnel/checkout",
        json={
            "idea": IDEA,
            "industry": "Economic development",
            "stage": "idea",
            "tier": "investor",
            "email": "buyer@example.com",
        },
    )
    assert r.status_code == 200
    order_id = r.json()["order_id"]

    r = client.get(f"/funnel/order/{order_id}")
    assert r.status_code == 200
    assert r.json()["status"] == "generated"

    r = client.get(f"/funnel/order/{order_id}/pdf")
    assert r.status_code == 200
    assert r.content[:4] == b"%PDF"


def test_funnel_checkout_rejects_unknown_tier(client):
    r = client.post(
        "/funnel/checkout",
        json={"idea": IDEA, "industry": "X", "stage": "idea", "tier": "platinum"},
    )
    assert r.status_code == 400


# --- Auth ---

def test_signup_and_login_flow(client, auth_headers):
    r = client.post(
        "/auth/signup", json={"email": "founder@tyrey.com", "password": "secret123"}
    )
    assert r.status_code == 409  # already exists (fixture created it)

    r = client.post(
        "/auth/login", json={"email": "founder@tyrey.com", "password": "wrong-pass"}
    )
    assert r.status_code == 401

    r = client.post(
        "/auth/login", json={"email": "founder@tyrey.com", "password": "secret123"}
    )
    assert r.status_code == 200

    r = client.get("/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == "founder@tyrey.com"


def test_me_requires_auth(client):
    assert client.get("/auth/me").status_code == 401


# --- Projects & generation ---

def test_module_catalog(client):
    r = client.get("/projects/modules")
    assert r.status_code == 200
    assert len(r.json()) == 11


def test_list_projects(client, auth_headers, project_id):
    r = client.get("/projects", headers=auth_headers)
    assert r.status_code == 200
    assert project_id in [p["id"] for p in r.json()]


def test_generate_document(client, document):
    assert "Business Genome" in document["title"]
    assert document["version"] == 1


def test_generate_rejects_unknown_module(client, auth_headers, project_id):
    r = client.post(
        f"/projects/{project_id}/generate",
        headers=auth_headers,
        json={"module": "not_a_module"},
    )
    assert r.status_code == 400


# --- Documents / vault ---

def test_vault_lists_documents(client, auth_headers, document):
    r = client.get("/vault", headers=auth_headers)
    assert r.status_code == 200
    assert document["id"] in [d["id"] for d in r.json()]


def test_edit_with_ai_bumps_version(client, auth_headers, document):
    r = client.post(
        f"/documents/{document['id']}/edit",
        headers=auth_headers,
        json={"instruction": "Make it shorter"},
    )
    assert r.status_code == 200
    assert r.json()["version"] == document["version"] + 1


def test_document_pdf(client, auth_headers, document):
    r = client.get(f"/documents/{document['id']}/pdf", headers=auth_headers)
    assert r.status_code == 200
    assert r.content[:4] == b"%PDF"


def test_cross_user_document_access_blocked(client, document):
    other = signup(client, "other@tyrey.com")
    assert client.get(f"/documents/{document['id']}", headers=other).status_code == 404


# --- Leads ---

def test_lead_capture_public(client):
    r = client.post(
        "/leads",
        json={
            "service": "due-diligence-studio",
            "name": "Jane Buyer",
            "email": "jane@example.com",
            "company": "Acme",
            "message": "Interested in a diligence report",
        },
    )
    assert r.status_code == 200
    assert r.json()["status"] == "new"


def test_lead_capture_rejects_unknown_service(client):
    r = client.post(
        "/leads",
        json={"service": "nope", "name": "X", "email": "x@example.com"},
    )
    assert r.status_code == 400


def test_lead_listing_denied_for_regular_users(client, auth_headers):
    assert client.get("/leads", headers=auth_headers).status_code == 403


def test_lead_listing_allowed_for_admin(client):
    admin = signup(client, "admin@tyrey.com")  # matches ADMIN_EMAILS in conftest
    r = client.get("/leads", headers=admin)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# --- Billing & subscription lifecycle ---

def test_billing_503_when_unconfigured(client, auth_headers):
    r = client.post("/billing/subscribe", headers=auth_headers, json={"plan": "pro"})
    assert r.status_code == 503


def _post_webhook(client, monkeypatch, event: dict):
    import stripe

    monkeypatch.setattr(
        stripe.Webhook, "construct_event", lambda payload, sig, secret: event
    )
    return client.post(
        "/funnel/webhook", content=b"{}", headers={"stripe-signature": "test-sig"}
    )


def test_webhook_activates_subscription_plan(client, monkeypatch):
    hdr = signup(client, "subscriber@tyrey.com")
    user_id = client.get("/auth/me", headers=hdr).json()["id"]

    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_sub",
                "metadata": {"user_id": user_id, "plan": "pro"},
            }
        },
    }
    assert _post_webhook(client, monkeypatch, event).status_code == 200
    assert client.get("/auth/me", headers=hdr).json()["plan"] == "pro"


def test_webhook_downgrades_on_subscription_deleted(client, monkeypatch):
    from app.database import SessionLocal
    from app.models import User

    hdr = signup(client, "churner@tyrey.com")
    user_id = client.get("/auth/me", headers=hdr).json()["id"]

    db = SessionLocal()
    user = db.get(User, user_id)
    user.plan = "executive"
    user.stripe_customer_id = "cus_test_churn"
    db.commit()
    db.close()

    event = {
        "type": "customer.subscription.deleted",
        "data": {"object": {"id": "sub_test", "customer": "cus_test_churn"}},
    }
    assert _post_webhook(client, monkeypatch, event).status_code == 200
    assert client.get("/auth/me", headers=hdr).json()["plan"] == "free"


def test_webhook_rejects_bad_signature(client):
    r = client.post(
        "/funnel/webhook", content=b"{}", headers={"stripe-signature": "garbage"}
    )
    assert r.status_code == 400
