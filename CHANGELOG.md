# Changelog

Notable changes to the TyRey Technologies platform. Dates are UTC.

## Unreleased

- Engineering foundation: CI workflow (migrations + smoke suite + type-check +
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
