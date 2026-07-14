# Architecture

TyRey Intelligence™ is a monorepo serving **one brand, one codebase, one deployment**:
tyreytechnologies.com is simultaneously the marketing site and the application.
The homepage is public marketing; every CTA routes directly into the product
(`/intelligence` funnel, `/signup`, `/login` → `/dashboard`).

## System overview

```
                    ┌────────────────────────────────────────────┐
                    │  Vercel — tyreytechnologies.com            │
                    │  Next.js 14 App Router (frontend/)         │
                    │                                            │
  visitor ────────▶ │  /            corporate homepage           │
                    │  /services/*  service pages + lead capture │
                    │  /intelligence  revenue funnel             │
                    │  /signup /login /dashboard/*  SaaS app     │
                    └───────────────────┬────────────────────────┘
                                        │ HTTPS (NEXT_PUBLIC_API_URL)
                    ┌───────────────────▼────────────────────────┐
                    │  Render — tyrey-backend.onrender.com       │
                    │  FastAPI (backend/app/)                    │
                    │                                            │
                    │  routers/   funnel · auth · projects ·     │
                    │             documents · billing · leads    │
                    │  connect/   Connect AI: messaging, inbox,  │
                    │             contacts, carrier adapter      │
                    │  ai_engine  Claude generation w/ framework │
                    │             injection (never freeform)     │
                    │  frameworks/  14 proprietary JSON templates│
                    │  pdf_service  fpdf2 → branded PDFs         │
                    └──────┬──────────┬───────┬──────────┬───────┘
                           │          │       │          │
                     Render Postgres  │   Anthropic   Stripe
                     (SQLite in dev)  │   Claude API  (checkout,
                                      │               subscriptions,
                                  Twilio (opt.)       webhooks)
                                  via provider
                                  adapter; demo
                                  mode default
```

## Frontend (`frontend/`)

Next.js 14 App Router, TypeScript, React 18. No CSS framework — design tokens
live as CSS variables in [globals.css](../frontend/src/app/globals.css)
(parchment/brass palette), components use inline styles plus a small set of
utility classes (`panel`, `btn`, `eyebrow`, `display`, `mono-label`).

Route map (`frontend/src/app/`):

| Route | Purpose |
|---|---|
| `/` | Corporate homepage — marketing, but every CTA enters the app |
| `/services/{due-diligence-studio,acquisition-scout,ceo-in-a-box}` | Service lines; `LeadForm` posts to `POST /leads` |
| `/intelligence` | Phase 8 revenue funnel: idea → free preview → paywall → Stripe |
| `/success` | Post-checkout order status + pack download |
| `/connect-ai` | TyRey Connect AI™ product page; lead capture (`service: "connect-ai"`) |
| `/signup`, `/login` | JWT auth (token stored client-side) |
| `/dashboard/{projects,documents,vault,billing}` | The SaaS product |
| `/dashboard/connect/{,inbox,contacts,settings}` | Connect AI: unified SMS inbox, contacts, AI receptionist settings |
| `/terms`, `/privacy` | Legal pages |

Shared pieces: [Site.tsx](../frontend/src/components/Site.tsx) (nav/footer/LeadForm),
`AuthForm`, `ServicePage`, `Markdown`, and `src/lib/api.ts` (fetch wrapper that
attaches the JWT and prefixes `NEXT_PUBLIC_API_URL`).

## Backend (`backend/app/`)

FastAPI + SQLAlchemy 2.0 (typed `Mapped` models) + Pydantic v2.

| Module | Responsibility |
|---|---|
| `main.py` | App assembly, CORS, health check |
| `config.py` | `pydantic-settings`; all config via env vars / `.env` |
| `database.py` | Engine, session factory, `Base` |
| `models.py` | `User`, `Project`, `Document`, `Lead`, `Order` |
| `schemas.py` | Request/response models |
| `security.py` | Password hashing, JWT issue/verify, `require_admin` gate |
| `ai_engine.py` | Prompt composition; always injects a framework JSON |
| `llm.py` | Model transport: provider seam, timeouts, retries with backoff, metadata logging (model/latency/tokens — never user content) |
| `prompts/` | Versioned auxiliary prompt files (editor, retry, preview constraints) |
| `pdf_service.py` | Markdown → branded PDF |
| `routers/` | One file per domain (see [README API overview](../README.md#api-overview)) |
| `connect/` | TyRey Connect AI™ messaging module: models, `/connect/*` router, service-layer compliance (STOP/HELP/START, opt-out, registration gate), signature-verified webhooks, usage metering, and the carrier **provider adapter** (`providers/`: demo default, Twilio) — see [connect-ai/ARCHITECTURE.md](connect-ai/ARCHITECTURE.md) |
| `frameworks/` | **The moat**: 14 proprietary framework templates (11 intelligence modules + 3 Connect conversation frameworks) |

### Design decisions worth knowing

- **Framework injection, never freeform prompting.** Every generation loads a
  JSON framework from `app/frameworks/` and structures the prompt around it.
  This is deliberate product IP (Phase 5 spec) — don't bypass it. Auxiliary
  prompts are versioned files in `app/prompts/`, never inline strings.
- **AI transport is isolated in `llm.py`.** One provider seam (`get_provider()`),
  SDK-level timeouts and retries with backoff, metadata-only logging. Provider
  failures surface as `LLMError` → a defined 502 response, never a raw stack
  trace.
- **Demo mode degrades gracefully.** No `ANTHROPIC_API_KEY` → clearly-labeled
  sample output. No `STRIPE_SECRET_KEY` → checkout fulfills instantly (dev
  only). The entire product is testable with zero keys; the test suite and CI
  depend on this.
- **Ownership isolation** is enforced in every router — queries always filter
  by the authenticated `user_id`. The test suite asserts cross-user access
  fails. Lead listing is admin-only (`ADMIN_EMAILS`, deny by default).
- **Two payment paths**: one-time funnel packs (`Order`, `/funnel/*`) and SaaS
  subscriptions (`User.plan`, `/billing/*`). Both converge on the
  `/funnel/webhook` Stripe endpoint: `checkout.session.completed` fulfills an
  order (order metadata) or activates a plan (user/plan metadata);
  `customer.subscription.deleted` downgrades the user to free.
- **Carrier connectivity is isolated behind a provider adapter**
  (`connect/providers/`), exactly as the Anthropic SDK is isolated in `llm.py`.
  `twilio.py` is the only file importing the twilio package; `demo.py` (the
  default) simulates sends so every Connect path works keyless. Provider
  failures surface as `ProviderError` → 502.
- **Auth is deliberately hand-rolled JWT for the MVP** (PBKDF2 + PyJWT). The
  Engineering Handbook prefers a managed provider (Clerk/Auth0/Supabase);
  migrating is an accepted future task — don't extend the custom auth surface
  (no password reset, sessions, or OAuth here) without revisiting that
  decision.

## Database

SQLite for local dev, Postgres (Render) in production — the SQLAlchemy models
are dialect-neutral. Schema changes go through **Alembic**
(`backend/migrations/`); see [DEPLOYMENT.md](DEPLOYMENT.md#database-migrations).
`init_db()` still runs `create_all` at startup as a dev convenience — it is a
no-op on tables that already exist and never alters them, so migrations are
the source of truth for schema evolution.

## Quality gates

- `backend/tests/` — pytest end-to-end API suite (`pytest` from `backend/`),
  demo mode, no keys. Covers funnel, auth, projects, vault, ownership
  isolation, the admin gate, and the subscription webhook lifecycle.
- `ruff check .` — lint (config in `backend/pyproject.toml`).
- `backend/evals/run_evals.py` + `golden_set.json` — AI output quality gate.
- CI ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) runs migrations,
  lint, the test suite, a frontend type-check, and a production build on every
  PR.

## Related docs

- [DEPLOYMENT.md](DEPLOYMENT.md) — environments, secrets, release process
- [CODING_STANDARDS.md](CODING_STANDARDS.md) — style, patterns, review bar
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — dev setup and workflow
- [../SECURITY.md](../SECURITY.md) — reporting vulnerabilities
