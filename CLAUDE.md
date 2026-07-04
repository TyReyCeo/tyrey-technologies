# CLAUDE.md — TyRey Technologies Platform

Rules for AI-assisted development in this repository. These reflect the code
as it actually is; where they differ from the aspirational Engineering
Handbook, the deviations are called out explicitly.

## What this is

TyRey Intelligence™ (TyRey Technologies, Inc.) — an AI-native decision
intelligence platform. One codebase serves the marketing site, the `/intelligence`
revenue funnel, and the SaaS dashboard. See README.md and docs/ARCHITECTURE.md.

## Tech stack (actual)

- Frontend: Next.js 14 App Router, React 18, TypeScript strict. **No CSS
  framework** — design tokens as CSS variables in `globals.css`, inline styles
  + shared utility classes are the house style.
- Backend: Python 3.12+, FastAPI, SQLAlchemy 2.x (typed `Mapped`), Pydantic v2.
- Database: SQLite in dev, PostgreSQL (Render) in prod. Migrations via Alembic.
- AI: Anthropic Claude behind `backend/app/llm.py` (the only place the SDK is
  called). Generation always injects a framework from `backend/app/frameworks/`.
- Auth: **hand-rolled JWT (PBKDF2 + PyJWT) — an accepted MVP deviation** from
  the handbook's managed-provider rule. Do not extend the custom auth surface
  (password reset, sessions, OAuth) — that work triggers the migration to a
  managed provider instead.
- Payments: Stripe (one-time funnel packs + subscriptions, one webhook:
  `POST /funnel/webhook`).
- Deployment: Vercel (frontend) + Render (backend + Postgres). Merging to
  `main` is shipping.

## Commands

- Backend dev: `cd backend && uvicorn app.main:app --reload`
- Backend checks: `cd backend && ruff check . && pytest`
- Frontend dev: `cd frontend && npm run dev`
- Frontend checks: `cd frontend && npx tsc --noEmit && npm run build`
- DB migration: `cd backend && alembic revision --autogenerate -m "<msg>" && alembic upgrade head`

Run the relevant checks before declaring any task done.

## Hard rules

1. Never commit secrets. `.env*` are gitignored; update `.env.example` /
   `.env.local.example` in the same change that adds a setting.
2. Validate every external input — Pydantic models on every request body.
3. Every authenticated query filters by `user_id` (ownership isolation).
   Admin-only endpoints use `require_admin` (`ADMIN_EMAILS`, deny by default).
4. TypeScript strict; no `any` without a justifying comment.
5. New backend endpoints get tests in `backend/tests/test_api.py` (happy path
   + auth/ownership failure). Tests run in demo mode — no keys, ever.
6. Schema changes always ship with an Alembic migration.
7. Delete dead code; don't comment it out.
8. No new dependencies for things the stack already does; justify any addition.
9. Keep the legal disclaimer on user-facing outputs: "Outputs are planning
   tools, not guarantees of business success or financial/legal advice."

## AI workflow rules

- Never freeform-prompt. Generation goes through `ai_engine.py` with a JSON
  framework from `app/frameworks/` injected. New document types = new
  framework JSON.
- Auxiliary prompts are versioned files in `backend/app/prompts/` — never
  inline strings.
- Model transport (timeouts, retries with backoff, metadata logging) lives in
  `llm.py`; never call the anthropic SDK anywhere else. Log model, latency,
  and token counts — never user content or secrets.
- Every AI path must degrade to demo mode without keys (labeled sample
  output), and provider failures surface as `LLMError` → 502, not stack traces.
- AI-quality changes update `backend/evals/golden_set.json`.

## Definition of done

Implemented → `ruff check . && pytest` green → frontend type-check/build green
if touched → docs updated if behavior or API changed → no secrets or dead code.
