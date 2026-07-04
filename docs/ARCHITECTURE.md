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
                    │  ai_engine  Claude generation w/ framework │
                    │             injection (never freeform)     │
                    │  frameworks/  11 proprietary JSON templates│
                    │  pdf_service  fpdf2 → branded PDFs         │
                    └──────┬──────────────┬──────────────┬───────┘
                           │              │              │
                     Render Postgres   Anthropic      Stripe
                     (SQLite in dev)   Claude API     (checkout,
                                                      subscriptions,
                                                      webhooks)
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
| `/signup`, `/login` | JWT auth (token stored client-side) |
| `/dashboard/{projects,documents,vault,billing}` | The SaaS product |
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
| `security.py` | Password hashing + JWT issue/verify |
| `ai_engine.py` | Claude calls; always injects a framework JSON |
| `pdf_service.py` | Markdown → branded PDF |
| `routers/` | One file per domain (see [README API overview](../README.md#api-overview)) |
| `frameworks/` | **The moat**: 11 proprietary framework templates |

### Design decisions worth knowing

- **Framework injection, never freeform prompting.** Every generation loads a
  JSON framework from `app/frameworks/` and structures the prompt around it.
  This is deliberate product IP (Phase 5 spec) — don't bypass it.
- **Demo mode degrades gracefully.** No `ANTHROPIC_API_KEY` → clearly-labeled
  sample output. No `STRIPE_SECRET_KEY` → checkout fulfills instantly (dev
  only). The entire product is testable with zero keys; the smoke suite and CI
  depend on this.
- **Ownership isolation** is enforced in every router — queries always filter
  by the authenticated `user_id`. The smoke suite asserts cross-user access
  fails.
- **Two payment paths**: one-time funnel packs (`Order`, `/funnel/*`) and SaaS
  subscriptions (`User.plan`, `/billing/*`). Both converge on Stripe webhooks.

## Database

SQLite for local dev, Postgres (Render) in production — the SQLAlchemy models
are dialect-neutral. Schema changes go through **Alembic**
(`backend/migrations/`); see [DEPLOYMENT.md](DEPLOYMENT.md#database-migrations).
`init_db()` still runs `create_all` at startup as a dev convenience — it is a
no-op on tables that already exist and never alters them, so migrations are
the source of truth for schema evolution.

## Quality gates

- `backend/tests/smoke_test.py` — 20-check end-to-end suite, demo mode, no keys.
- `backend/evals/run_evals.py` + `golden_set.json` — AI output quality gate.
- CI ([.github/workflows/ci.yml](../.github/workflows/ci.yml)) runs migrations,
  the smoke suite, a frontend type-check, and a production build on every PR.

## Related docs

- [DEPLOYMENT.md](DEPLOYMENT.md) — environments, secrets, release process
- [CODING_STANDARDS.md](CODING_STANDARDS.md) — style, patterns, review bar
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — dev setup and workflow
- [../SECURITY.md](../SECURITY.md) — reporting vulnerabilities
