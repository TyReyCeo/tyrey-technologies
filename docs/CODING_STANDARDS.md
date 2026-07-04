# Coding standards

The bar: code a new engineer can read without a tour guide. Match the style of
the file you're editing; when in doubt, copy the pattern of the nearest
existing router/page.

## Repository-wide

- **Small PRs, one concern each.** Schema change + migration together; refactor
  and feature separately.
- **No secrets in the repo, ever.** `.env` files are gitignored; templates
  (`.env.example`, `.env.local.example`) are updated in the same PR that adds
  a setting.
- **Every user-visible output keeps the disclaimer** where the design places it:
  "Outputs are planning tools, not guarantees of business success or
  financial/legal advice." This is a legal requirement, not copy polish.
- Commit messages: imperative mood, subject ≤ 72 chars, body explains *why*
  when it isn't obvious. Prefixes like `feat:`, `fix:`, `chore:` welcome but
  not enforced.

## Backend (Python / FastAPI)

- Python 3.12, 4-space indent, double quotes, f-strings. Type hints on all
  function signatures; SQLAlchemy models use the typed `Mapped[...]` /
  `mapped_column` style already in [models.py](../backend/app/models.py).
- **Routers own HTTP, nothing else.** Business logic that grows beyond a few
  lines moves to a module (`ai_engine.py`, `pdf_service.py` are the pattern).
  One router file per domain.
- **Every authenticated query filters by `user_id`.** Ownership isolation is a
  hard rule; the smoke suite asserts it. A missing filter is a security bug,
  not a style nit.
- **Never freeform-prompt the model.** All generation goes through
  `ai_engine.py` with a framework from `app/frameworks/` injected. New
  document types = new framework JSON, not a new prompt string.
- **Degrade to demo mode, don't crash.** Code paths that need external keys
  (`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`) must behave sensibly without
  them — labeled sample output or dev-mode fulfillment. CI has no keys.
- Config only via `config.py` / environment variables. No literals for URLs,
  keys, or model names in code.
- Schema changes always ship with an Alembic migration
  ([DEPLOYMENT.md](DEPLOYMENT.md#database-migrations)).
- Extend `tests/smoke_test.py` for every new endpoint (happy path + auth/
  ownership failure). AI-quality changes update `evals/golden_set.json`.

## Frontend (TypeScript / Next.js)

- TypeScript strict; `npx tsc --noEmit` must pass (CI enforces).
- App Router conventions: server components by default, `"use client"` only
  when state/effects require it.
- **All backend calls go through `src/lib/api.ts`** — never raw `fetch` with a
  hardcoded URL. The wrapper handles the base URL and JWT.
- Styling: design tokens are CSS variables in `globals.css`
  (`--parchment`, `--brass`, `--line`, …) plus the shared utility classes
  (`panel`, `btn`, `eyebrow`, `display`, `mono-label`). Inline styles are the
  house style; don't introduce a CSS framework or styled-components.
- Reuse `Site.tsx` (nav/footer/LeadForm), `AuthForm`, `Markdown`,
  `ServicePage` before writing new variants.
- Marketing pages must keep their CTAs pointed **into the app**
  (`/intelligence`, `/signup`, `/login`) — the site is the application, not a
  brochure.

## Review checklist (what approvals look for)

1. CI green (migrations apply, smoke suite, type-check, build).
2. No secret material or personal data in code, fixtures, or logs.
3. Ownership isolation on any new authenticated endpoint.
4. Migration present and reversible for any schema change.
5. Docs/templates updated when behavior or config changed.
