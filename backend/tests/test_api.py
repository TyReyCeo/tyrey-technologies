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


# =====================================================================
# TyRey Connect AI (Phase 1) — demo provider, no carrier keys
# =====================================================================

_sid_counter = iter(range(100000, 999999))


def _connect_user(client, email: str) -> tuple[dict, dict]:
    """Sign up a user with a provisioned demo number. Returns (headers, number)."""
    headers = signup(client, email)
    r = client.post("/connect/numbers", headers=headers, json={})
    assert r.status_code == 200, r.text
    return headers, r.json()


def _inbound(client, to_e164: str, from_e164: str, body: str, sid: str | None = None):
    return client.post(
        "/connect/webhooks/demo/inbound",
        data={
            "MessageSid": sid or f"SMtest{next(_sid_counter)}",
            "From": from_e164,
            "To": to_e164,
            "Body": body,
        },
    )


# --- Numbers ---

def test_connect_provision_demo_number(client):
    headers, number = _connect_user(client, "connect-num@tyrey.com")
    assert number["e164"].startswith("+1555")
    assert number["provider"] == "demo"
    assert number["status"] == "active"  # demo numbers skip registration

    r = client.get("/connect/numbers", headers=headers)
    assert r.status_code == 200
    assert [n["id"] for n in r.json()] == [number["id"]]


def test_connect_numbers_require_auth(client):
    assert client.get("/connect/numbers").status_code == 401
    assert client.post("/connect/numbers", json={}).status_code == 401


def test_connect_release_number(client):
    headers, number = _connect_user(client, "connect-release@tyrey.com")
    r = client.delete(f"/connect/numbers/{number['id']}", headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "released"
    assert client.get("/connect/numbers", headers=headers).json() == []
    # released numbers 404 on further release
    assert client.delete(f"/connect/numbers/{number['id']}", headers=headers).status_code == 404


def test_connect_number_ownership_isolated(client):
    _, number = _connect_user(client, "connect-owner@tyrey.com")
    other = signup(client, "connect-intruder@tyrey.com")
    assert client.delete(f"/connect/numbers/{number['id']}", headers=other).status_code == 404


def test_connect_admin_number_status_gate(client):
    headers, number = _connect_user(client, "connect-admin-t@tyrey.com")
    r = client.patch(
        f"/connect/admin/numbers/{number['id']}", headers=headers, json={"status": "active"}
    )
    assert r.status_code == 403  # regular users can't touch registration status

    admin = signup(client, "admin2@tyrey.com")  # not in ADMIN_EMAILS either
    assert (
        client.patch(
            f"/connect/admin/numbers/{number['id']}", headers=admin, json={"status": "active"}
        ).status_code
        == 403
    )

    # admin@tyrey.com matches ADMIN_EMAILS in conftest (may already exist)
    r = client.post("/auth/signup", json={"email": "admin@tyrey.com", "password": "secret123"})
    if r.status_code != 200:
        r = client.post("/auth/login", json={"email": "admin@tyrey.com", "password": "secret123"})
    real_admin = {"Authorization": f"Bearer {r.json()['token']}"}
    r = client.patch(
        f"/connect/admin/numbers/{number['id']}",
        headers=real_admin,
        json={"status": "pending_registration"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "pending_registration"


# --- Contacts ---

def test_connect_contact_crud_and_validation(client):
    headers, _ = _connect_user(client, "connect-contacts@tyrey.com")

    r = client.post(
        "/connect/contacts",
        headers=headers,
        json={"name": "Jake Miller", "phone_e164": "+15155550101", "company": "Miller Farms"},
    )
    assert r.status_code == 200, r.text
    contact = r.json()
    assert contact["sms_opt_out"] is False

    # duplicate phone for same user
    r = client.post(
        "/connect/contacts",
        headers=headers,
        json={"name": "Dup", "phone_e164": "+15155550101"},
    )
    assert r.status_code == 409

    # invalid phone rejected by validation
    r = client.post(
        "/connect/contacts", headers=headers, json={"name": "Bad", "phone_e164": "555-0101"}
    )
    assert r.status_code == 422

    # search
    r = client.get("/connect/contacts?query=jake", headers=headers)
    assert [c["id"] for c in r.json()] == [contact["id"]]

    # manual opt-out toggle
    r = client.patch(
        f"/connect/contacts/{contact['id']}", headers=headers, json={"sms_opt_out": True}
    )
    assert r.status_code == 200
    assert r.json()["sms_opt_out"] is True

    # delete
    assert client.delete(f"/connect/contacts/{contact['id']}", headers=headers).status_code == 200
    assert client.get("/connect/contacts", headers=headers).json() == []


def test_connect_contact_ownership_isolated(client):
    headers, _ = _connect_user(client, "connect-c-owner@tyrey.com")
    contact = client.post(
        "/connect/contacts", headers=headers, json={"name": "Mine", "phone_e164": "+15155550102"}
    ).json()
    other = signup(client, "connect-c-intruder@tyrey.com")
    assert client.patch(
        f"/connect/contacts/{contact['id']}", headers=other, json={"name": "Stolen"}
    ).status_code == 404
    assert client.delete(f"/connect/contacts/{contact['id']}", headers=other).status_code == 404


def test_connect_csv_import(client):
    headers, _ = _connect_user(client, "connect-import@tyrey.com")
    csv_text = (
        "name,phone,email,company\n"
        "Ann Lee,+15155550201,ann@example.com,Lee Co\n"
        "Bob Ray,+15155550202,,\n"
        "Bad Row,555-999,, \n"
        "Ann Dup,+15155550201,,\n"
    )
    r = client.post("/connect/contacts/import", headers=headers, json={"csv": csv_text})
    assert r.status_code == 200, r.text
    result = r.json()
    assert result["imported"] == 2
    assert result["skipped"] == 2  # one invalid, one duplicate
    assert any("invalid phone" in e for e in result["errors"])

    r = client.post(
        "/connect/contacts/import", headers=headers, json={"csv": "nope\njust text"}
    )
    assert r.status_code == 400


# --- Conversations & messaging ---

def test_connect_two_way_conversation_flow(client):
    headers, number = _connect_user(client, "connect-flow@tyrey.com")
    contact = client.post(
        "/connect/contacts", headers=headers, json={"name": "Flow Contact", "phone_e164": "+15155550301"}
    ).json()

    # outbound-initiated thread
    r = client.post(
        "/connect/conversations",
        headers=headers,
        json={"contact_id": contact["id"], "body": "Hi from the business!"},
    )
    assert r.status_code == 200, r.text
    thread = r.json()
    assert thread["status"] == "open"
    assert len(thread["messages"]) == 1
    assert thread["messages"][0]["status"] == "simulated"  # demo provider labels sends
    assert thread["messages"][0]["author"] == "user"

    # inbound reply lands in the same thread and triggers the AI receptionist
    r = _inbound(client, number["e164"], "+15155550301", "What are your hours?")
    assert r.status_code == 200
    assert r.json()["status"] == "received"

    r = client.get(f"/connect/conversations/{thread['id']}", headers=headers)
    messages = r.json()["messages"]
    assert [m["author"] for m in messages] == ["user", "contact", "ai"]
    assert "demo" in messages[2]["body"].lower()  # AI demo reply is labeled

    # reply from the inbox
    r = client.post(
        f"/connect/conversations/{thread['id']}/messages",
        headers=headers,
        json={"body": "We're open 9-6 Tue-Sat"},
    )
    assert r.status_code == 200
    assert len(r.json()["messages"]) == 4

    # inbox list shows the conversation with a preview
    r = client.get("/connect/conversations", headers=headers)
    assert r.status_code == 200
    items = [c for c in r.json() if c["id"] == thread["id"]]
    assert items and items[0]["last_message_preview"]

    # status/assign/ai toggle
    r = client.patch(
        f"/connect/conversations/{thread['id']}",
        headers=headers,
        json={"status": "closed", "ai_enabled": False},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "closed"
    assert r.json()["ai_enabled"] is False

    r = client.patch(
        f"/connect/conversations/{thread['id']}", headers=headers, json={"status": "bogus"}
    )
    assert r.status_code == 400


def test_connect_conversation_ownership_isolated(client):
    headers, _ = _connect_user(client, "connect-conv-owner@tyrey.com")
    contact = client.post(
        "/connect/contacts", headers=headers, json={"name": "Priv", "phone_e164": "+15155550302"}
    ).json()
    thread = client.post(
        "/connect/conversations",
        headers=headers,
        json={"contact_id": contact["id"], "body": "private"},
    ).json()

    other = signup(client, "connect-conv-intruder@tyrey.com")
    assert client.get(f"/connect/conversations/{thread['id']}", headers=other).status_code == 404
    assert client.post(
        f"/connect/conversations/{thread['id']}/messages", headers=other, json={"body": "hi"}
    ).status_code == 404


def test_connect_start_conversation_requires_number(client):
    headers = signup(client, "connect-no-number@tyrey.com")
    contact = client.post(
        "/connect/contacts", headers=headers, json={"name": "NoNum", "phone_e164": "+15155550303"}
    ).json()
    r = client.post(
        "/connect/conversations",
        headers=headers,
        json={"contact_id": contact["id"], "body": "hello?"},
    )
    assert r.status_code == 409


# --- Compliance: STOP / HELP / START ---

def test_connect_stop_keyword_blocks_sends(client):
    headers, number = _connect_user(client, "connect-stop@tyrey.com")
    contact = client.post(
        "/connect/contacts", headers=headers, json={"name": "Opt Out", "phone_e164": "+15155550401"}
    ).json()
    thread = client.post(
        "/connect/conversations",
        headers=headers,
        json={"contact_id": contact["id"], "body": "Welcome!"},
    ).json()

    r = _inbound(client, number["e164"], "+15155550401", "STOP")
    assert r.status_code == 200

    # opt-out recorded, no AI auto-reply was sent
    r = client.get(f"/connect/conversations/{thread['id']}", headers=headers)
    assert [m["author"] for m in r.json()["messages"]] == ["user", "contact"]
    contact_now = client.get("/connect/contacts", headers=headers).json()[0]
    assert contact_now["sms_opt_out"] is True

    # every outbound send is now blocked
    r = client.post(
        f"/connect/conversations/{thread['id']}/messages", headers=headers, json={"body": "wait"}
    )
    assert r.status_code == 409

    # START opts back in (confirmation is sent, then sending works again)
    r = _inbound(client, number["e164"], "+15155550401", "START")
    assert r.status_code == 200
    contact_now = client.get("/connect/contacts", headers=headers).json()[0]
    assert contact_now["sms_opt_out"] is False
    r = client.post(
        f"/connect/conversations/{thread['id']}/messages", headers=headers, json={"body": "hi again"}
    )
    assert r.status_code == 200


def test_connect_help_keyword_answers_without_ai(client):
    headers, number = _connect_user(client, "connect-help@tyrey.com")
    client.put(
        "/connect/profile",
        headers=headers,
        json={"business_name": "Perry Diner", "business_profile": "", "ai_auto_reply": True},
    )
    r = _inbound(client, number["e164"], "+15155550402", "HELP")
    assert r.status_code == 200
    thread = client.get("/connect/conversations", headers=headers).json()[0]
    messages = client.get(f"/connect/conversations/{thread['id']}", headers=headers).json()["messages"]
    assert [m["author"] for m in messages] == ["contact", "ai"]
    assert "Perry Diner" in messages[1]["body"]
    assert "STOP" in messages[1]["body"]


# --- Webhook idempotency & signature ---

def test_connect_inbound_webhook_idempotent(client):
    headers, number = _connect_user(client, "connect-idem@tyrey.com")
    sid = "SMfixed12345"
    assert _inbound(client, number["e164"], "+15155550403", "hello", sid=sid).json()["status"] == "received"
    assert _inbound(client, number["e164"], "+15155550403", "hello", sid=sid).json()["status"] == "duplicate"

    thread = client.get("/connect/conversations", headers=headers).json()[0]
    messages = client.get(f"/connect/conversations/{thread['id']}", headers=headers).json()["messages"]
    assert len([m for m in messages if m["direction"] == "in"]) == 1


def test_connect_status_webhook_updates_message(client):
    headers, number = _connect_user(client, "connect-status@tyrey.com")
    contact = client.post(
        "/connect/contacts", headers=headers, json={"name": "Status", "phone_e164": "+15155550404"}
    ).json()
    thread = client.post(
        "/connect/conversations",
        headers=headers,
        json={"contact_id": contact["id"], "body": "track me"},
    ).json()
    sid = thread["messages"][0]["provider_sid"]

    r = client.post(
        "/connect/webhooks/demo/status",
        data={"MessageSid": sid, "MessageStatus": "delivered"},
    )
    assert r.status_code == 200
    assert r.json()["status"] == "updated"

    # terminal status never regresses on carrier retries
    r = client.post(
        "/connect/webhooks/demo/status",
        data={"MessageSid": sid, "MessageStatus": "sent"},
    )
    assert r.json()["status"] == "unchanged"

    messages = client.get(f"/connect/conversations/{thread['id']}", headers=headers).json()["messages"]
    assert messages[0]["status"] == "delivered"


def test_connect_webhook_unknown_provider_404(client):
    r = client.post(
        "/connect/webhooks/twilio/inbound",
        data={"MessageSid": "SMx", "From": "+15155550001", "To": "+15155550002", "Body": "hi"},
    )
    assert r.status_code == 404  # twilio isn't the active provider in demo mode


# --- AI: drafts, receptionist gate, summary ---

def test_connect_ai_draft_is_explicit_and_labeled(client):
    headers, number = _connect_user(client, "connect-draft@tyrey.com")
    _inbound(client, number["e164"], "+15155550405", "Do you take walk-ins?")
    thread = client.get("/connect/conversations", headers=headers).json()[0]

    r = client.post(f"/connect/conversations/{thread['id']}/ai-draft", headers=headers)
    assert r.status_code == 200
    assert r.json()["demo"] is True
    assert "demo" in r.json()["draft"].lower()

    # drafting must NOT send anything
    messages = client.get(f"/connect/conversations/{thread['id']}", headers=headers).json()["messages"]
    assert [m["author"] for m in messages] == ["contact", "ai"]  # inbound + auto-reply only


def test_connect_ai_disabled_stops_auto_reply(client):
    headers, number = _connect_user(client, "connect-noai@tyrey.com")
    client.put(
        "/connect/profile",
        headers=headers,
        json={"business_name": "Quiet Co", "business_profile": "", "ai_auto_reply": False},
    )
    _inbound(client, number["e164"], "+15155550406", "Anyone there?")
    thread = client.get("/connect/conversations", headers=headers).json()[0]
    messages = client.get(f"/connect/conversations/{thread['id']}", headers=headers).json()["messages"]
    assert [m["author"] for m in messages] == ["contact"]  # no AI reply


def test_connect_summarize_stores_summary(client):
    headers, number = _connect_user(client, "connect-summary@tyrey.com")
    _inbound(client, number["e164"], "+15155550407", "I need a quote for a fence")
    thread = client.get("/connect/conversations", headers=headers).json()[0]

    r = client.post(f"/connect/conversations/{thread['id']}/summarize", headers=headers)
    assert r.status_code == 200
    assert r.json()["ai_summary"]


# --- Usage ---

def test_connect_usage_summary_counts_sends(client):
    headers, number = _connect_user(client, "connect-usage@tyrey.com")
    contact = client.post(
        "/connect/contacts", headers=headers, json={"name": "Meter", "phone_e164": "+15155550408"}
    ).json()
    client.post(
        "/connect/conversations",
        headers=headers,
        json={"contact_id": contact["id"], "body": "metered message"},
    )
    _inbound(client, number["e164"], "+15155550408", "got it")  # + AI auto-reply (also metered)

    r = client.get("/connect/usage/summary", headers=headers)
    assert r.status_code == 200
    summary = r.json()
    kinds = {i["kind"]: i["quantity"] for i in summary["items"]}
    assert kinds.get("sms_out", 0) >= 2  # user send + AI auto-reply
    assert kinds.get("sms_in", 0) >= 1
    assert summary["total_cost_cents"] > 0


# --- Plan gating & rate limiting ---

def test_connect_plan_gate_when_billing_configured(client, monkeypatch):
    from app.config import settings as app_settings

    headers = signup(client, "connect-gated@tyrey.com")
    monkeypatch.setattr(app_settings, "STRIPE_SECRET_KEY", "sk_test_gate")
    r = client.get("/connect/numbers", headers=headers)
    assert r.status_code == 402  # free plan blocked once billing is live

    # activating a Connect plan (via the Stripe webhook) unlocks the routes
    user_id = client.get("/auth/me", headers=headers).json()["id"]
    event = {
        "type": "checkout.session.completed",
        "data": {"object": {"id": "cs_test_connect", "metadata": {"user_id": user_id, "plan": "connect"}}},
    }
    assert _post_webhook(client, monkeypatch, event).status_code == 200
    assert client.get("/connect/numbers", headers=headers).status_code == 200


def test_connect_send_rate_limited(client, monkeypatch):
    from app.config import settings as app_settings

    headers, _ = _connect_user(client, "connect-rate@tyrey.com")
    contact = client.post(
        "/connect/contacts", headers=headers, json={"name": "Rate", "phone_e164": "+15155550409"}
    ).json()
    monkeypatch.setattr(app_settings, "CONNECT_SEND_RATE_PER_MIN", 2)

    r = client.post(
        "/connect/conversations",
        headers=headers,
        json={"contact_id": contact["id"], "body": "one"},
    )
    assert r.status_code == 200
    thread_id = r.json()["id"]
    assert client.post(
        f"/connect/conversations/{thread_id}/messages", headers=headers, json={"body": "two"}
    ).status_code == 200
    assert client.post(
        f"/connect/conversations/{thread_id}/messages", headers=headers, json={"body": "three"}
    ).status_code == 429


# --- Profile ---

def test_connect_profile_roundtrip(client):
    headers = signup(client, "connect-profile@tyrey.com")
    r = client.get("/connect/profile", headers=headers)
    assert r.status_code == 200
    assert r.json()["ai_auto_reply"] is True  # defaults

    r = client.put(
        "/connect/profile",
        headers=headers,
        json={
            "business_name": "Main Street Barbershop",
            "business_profile": "Open Tue-Sat 9-6. Haircuts $25.",
            "ai_auto_reply": False,
        },
    )
    assert r.status_code == 200
    assert r.json()["business_name"] == "Main Street Barbershop"
    assert r.json()["ai_auto_reply"] is False
