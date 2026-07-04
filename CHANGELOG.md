# Changelog

Notable changes to the TyRey Technologies platform. Dates are UTC.

## Unreleased

- **Security**: lead listing (`GET /leads`) is now admin-only via the new
  `ADMIN_EMAILS` setting (deny by default) — previously any authenticated user
  could read all captured leads.
- **Billing**: Stripe webhook now activates SaaS subscriptions
  (`checkout.session.completed` with user/plan metadata sets `User.plan`) and
  downgrades to free on `customer.subscription.deleted`. Previously paid
  subscriptions were never applied to the account.
- **AI layer**: new `llm.py` provider seam with request timeouts, SDK retries
  with backoff, metadata logging (model/latency/tokens, never user content),
  and a defined 502 error path (`LLMError`). Auxiliary prompts moved from
  inline strings to versioned files in `backend/app/prompts/`.
- **Tooling**: smoke script converted to a pytest suite (`backend/tests/`,
  22 tests incl. admin gate + webhook lifecycle), `ruff` linting added,
  CI updated, `requirements-dev.txt` + `pyproject.toml` added, repo-root
  `CLAUDE.md` added for AI-assisted development.
- Engineering foundation: CI workflow (migrations + tests + type-check +
  build), Render deploy automation, Alembic migrations with initial schema,
  issue/PR templates, CODEOWNERS, Dependabot, and the Markdown doc set
  (architecture, deployment, coding standards, contributing, security).

## 2026-07-04

- tyreytechnologies.com live on Vercel DNS; lead submission verified
  end-to-end in production.
- Open Graph / Twitter metadata with edge-generated share image.
- GitHub → Vercel auto-deploy connected for the frontend.

## 2026-07-03 — v1.0

- Initial platform build from the MVP Build Spec v1.0 and Phase 8 funnel spec:
  - FastAPI backend: funnel (preview → checkout → webhook → pack + PDF), JWT
    auth, projects, document vault, Edit-with-AI, Stripe billing, leads API.
  - 11-framework proprietary IP library with framework-injected generation.
  - Next.js 14 frontend: corporate homepage, three service pages with lead
    capture, `/intelligence` funnel, signup/login, full dashboard.
  - Demo mode (keyless local dev), 20-check smoke suite, AI evals gate.
- Deployed: frontend to Vercel, backend + Postgres to Render, Stripe test mode.
