# TyRey Connect AI™ — Architecture

How Connect AI integrates into the existing `tyrey-technologies` monorepo.
This extends — never replaces — the platform architecture in
`docs/ARCHITECTURE.md` and the rules in `CLAUDE.md`.

## 1. Principles

1. **One codebase.** Connect AI is a module: `backend/app/connect/` and
   `frontend/src/app/dashboard/connect/` (+ the public `/connect-ai` page).
2. **Providers are plugins.** Carrier connectivity lives behind an adapter
   interface, exactly as the Anthropic SDK lives behind `llm.py`. Twilio is
   an implementation detail we can swap.
3. **Demo mode everywhere.** No provider keys → simulated sends, labeled
   clearly. All tests run keyless.
4. **AI through the engine.** Conversational AI = `ai_engine.py` + framework
   JSONs. No inline prompts, no SDK calls outside `llm.py`.
5. **Compliance in the data model.** Consent, opt-out, and audit fields are
   schema, not afterthoughts.

## 2. Backend layout

```
backend/app/connect/
├── __init__.py
├── router.py            # FastAPI router: /connect/* endpoints
├── models.py            # SQLAlchemy models (below)
├── schemas.py           # Pydantic request/response models
├── service.py           # business logic (send, receive, thread, assign)
├── ai.py                # conversation-AI orchestration (calls ai_engine)
├── usage.py             # usage metering → Stripe usage records
├── webhooks.py          # inbound provider webhooks (signature-verified)
└── providers/
    ├── __init__.py      # get_provider() factory, reads settings
    ├── base.py          # Protocol: the adapter interface
    ├── demo.py          # simulated provider (default; used in tests)
    └── twilio.py        # first real adapter (Phase 1)
```

Register `router.py` in `app/main.py` under prefix `/connect`.

## 3. Provider adapter interface

`providers/base.py` defines the only surface the rest of the app may use:

```python
class MessagingProvider(Protocol):
    def send_sms(self, *, from_number: str, to_number: str, body: str,
                 media_urls: list[str] | None = None) -> ProviderMessageResult: ...
    def provision_number(self, *, area_code: str | None,
                         toll_free: bool) -> ProvisionedNumber: ...
    def release_number(self, *, provider_sid: str) -> None: ...
    def verify_webhook(self, *, headers: Mapping[str, str],
                       body: bytes) -> bool: ...

class VoiceProvider(Protocol):  # Phase 2
    def start_call(...) -> ...: ...
    def answer_webhook(...) -> ...: ...   # returns call-control instructions
```

Rules:

- `twilio.py` is the ONLY file that imports the `twilio` package (new
  dependency — justified: carrier connectivity is not something the stack
  already does).
- `demo.py` returns deterministic fake SIDs, marks messages
  `status="simulated"`, and never sleeps. It is the default when
  `CONNECT_PROVIDER` is unset — mirroring AI demo mode.
- Provider failures raise `ProviderError` → surfaced as 502 with a clean
  message (same pattern as `LLMError`).
- Settings added to `.env.example`: `CONNECT_PROVIDER` (`demo`|`twilio`),
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WEBHOOK_SECRET`.

## 4. Data model (Phase 1 core)

All tables via SQLAlchemy 2.x typed `Mapped`, shipped with Alembic
migrations. Workspace scoping: Phase 1 keeps the existing pattern of
`user_id` ownership; a `Workspace` with memberships lands in Phase 2 when
team seats arrive (migration path noted below).

```
ConnectNumber        id, user_id FK, e164, provider, provider_sid,
                     toll_free bool, status, created_at

Contact              id, user_id FK, name, phone_e164 (unique per user),
                     email, company, tags JSON, sms_opt_out bool,
                     sms_opt_out_at, source, created_at, updated_at

Conversation         id, user_id FK, contact_id FK, channel enum(sms|...),
                     number_id FK, status enum(open|pending|closed),
                     assigned_to, ai_enabled bool default true,
                     last_message_at, ai_summary text, created_at

Message              id, conversation_id FK, direction enum(in|out),
                     body text, media JSON, author enum(contact|user|ai),
                     provider_sid, status enum(queued|sent|delivered|
                     failed|simulated|received), error text,
                     segments int, created_at

UsageRecord          id, user_id FK, kind enum(sms_out|sms_in|mms_out|...),
                     quantity, unit_cost_cents, message_id FK nullable,
                     stripe_reported bool, created_at

AuditLog (reuse/extend if one exists)
                     actor, action, entity, entity_id, meta JSON, created_at
```

Indexes: `(user_id, last_message_at)` on Conversation; `(conversation_id,
created_at)` on Message; unique `(user_id, phone_e164)` on Contact.

**Phase 2 additions:** Workspace, WorkspaceMember(role), Deal, Pipeline,
Task, CallRecord (recording_url, transcript, duration, direction), and a
`workspace_id` backfill migration that creates one workspace per existing
user and repoints `user_id` scoping to workspace membership checks.

**Phase 3 additions:** Campaign, CampaignRecipient, Segment, Workflow
(definition JSON), WorkflowRun, EmailEvent.

## 5. API surface (Phase 1)

All endpoints authenticated (existing JWT dependency), all queries filtered
by owner, all bodies validated with Pydantic. Tests: happy path + auth /
ownership failure per endpoint, in `backend/tests/test_api.py`.

```
POST   /connect/numbers                 provision (demo: fake number)
GET    /connect/numbers
DELETE /connect/numbers/{id}

GET    /connect/contacts?query=&tag=    paginated
POST   /connect/contacts
POST   /connect/contacts/import         CSV upload (validated, deduped)
PATCH  /connect/contacts/{id}
DELETE /connect/contacts/{id}

GET    /connect/conversations?status=   inbox list, sorted last_message_at
GET    /connect/conversations/{id}      thread with messages
POST   /connect/conversations/{id}/messages    send reply
PATCH  /connect/conversations/{id}      status / assign / ai_enabled toggle
POST   /connect/conversations/{id}/ai-draft    AI-drafted reply (returns
                                               draft; sending is explicit)

POST   /connect/webhooks/{provider}/inbound    inbound message (signature-
POST   /connect/webhooks/{provider}/status     verified, unauthenticated)

GET    /connect/usage/summary           current-period usage for billing UI
```

Webhook handlers must be idempotent (dedupe on `provider_sid`) — port the
idempotency-with-tests approach noted from the archive build.

## 6. AI integration

- New frameworks in `backend/app/frameworks/`:
  - `connect_receptionist.json` — first-touch auto-reply: answer from
    workspace knowledge, capture name/need, offer scheduling, escalate on
    low confidence or explicit request.
  - `connect_reply_draft.json` — draft a reply in thread context for human
    review.
  - `connect_summarize.json` — thread summary + sentiment + suggested next
    action (stored on Conversation.ai_summary).
- `connect/ai.py` builds engine inputs (thread transcript, contact record,
  workspace business profile) and parses structured output. It never calls
  `llm.py` directly for prompting — always through `ai_engine.py`.
- Auto-reply policy: runs only when `Conversation.ai_enabled` and workspace
  AI settings allow; every AI message stored with `author="ai"` and rendered
  with an AI label; STOP/HELP keywords bypass AI entirely (compliance path).
- Demo mode: labeled sample outputs, as everywhere else.
- Add golden cases to `backend/evals/golden_set.json` for each framework.

## 7. Frontend layout

```
frontend/src/app/connect-ai/page.tsx        public product page (SHIPPED)
frontend/src/app/dashboard/connect/
├── page.tsx          overview: number, usage, recent conversations
├── inbox/page.tsx    conversation list + thread view (client component)
├── contacts/page.tsx list, search, CSV import
└── settings/page.tsx AI on/off, business profile for AI, number mgmt
```

House style: no CSS framework; design tokens from `globals.css`, inline
styles + shared utility classes; reuse the dashboard layout/nav. `lib/api.ts`
for all calls. TypeScript strict.

Inbox refresh: poll every ~10s in Phase 1 (matches existing stack; no new
websocket dependency). Revisit SSE/websockets only if polling proves
inadequate — justify per CLAUDE.md rule 8.

## 8. Billing

- Two new Stripe subscription prices (Connect $495, Connect Executive $995)
  configured in Stripe dashboard; plan gating mirrors the existing
  subscription checks.
- Usage: `usage.py` writes UsageRecords at send/receive time; a periodic
  job (or on-invoice hook) reports metered usage to Stripe. Phase 1 can
  display usage in-app and defer metered invoicing to Phase 2.
- Reuse the single existing webhook (`POST /funnel/webhook`) for
  subscription lifecycle; keep handlers idempotent.

## 9. Security & compliance checklist

- Webhook signature verification on every provider callback; reject on fail.
- STOP/HELP/START keyword handling at the service layer (before AI), with
  `sms_opt_out` enforcement on every outbound send — including campaigns.
- 10DLC / toll-free registration tracked per number (status field; admin
  visibility). Real sends blocked until the number's registration is active
  (demo mode exempt).
- Call recording consent (Phase 2): per-workspace setting + announcement.
- Rate limiting on send endpoints; volume anomaly alerts in admin.
- No message content in logs. Log IDs, counts, latency, provider status.

## 10. Deployment

No new services: FastAPI backend on Render (webhooks are plain HTTPS
endpoints), Next.js on Vercel. Provider keys via Render env vars. SQLite
dev / Postgres prod unchanged. Merging to `main` is shipping — Connect AI
work stays on feature branches until each phase is reviewed.
