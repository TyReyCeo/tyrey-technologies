# TyRey Technologies, Inc.

**Building the Intelligence Infrastructure for Modern Business**

This monorepo contains **TyRey Intelligence™** — the AI-powered strategic advisory platform — implementing both:

1. **The Phase 8 revenue funnel** (public landing page): idea → free AI preview → paywall → Stripe checkout → downloadable Investor Business Pack.
2. **The full MVP SaaS** (per MVP Build Spec v1.0): accounts, projects, intelligence modules, document vault, Edit-with-AI, PDF export.

## Structure

```
tyrey-technologies/
├── backend/                  FastAPI + SQLAlchemy + Anthropic Claude + Stripe
│   └── app/frameworks/       Proprietary framework IP library (11 frameworks)
├── frontend/                 Next.js (funnel + SaaS dashboard)
├── docs/                     Corporate document set
└── docker-compose.yml
```

## Intelligence modules (framework IP library)

Business Plan · Investor Memo · Market Analysis · **Business Genome™** ·
**Intelligence Score™** · Executive Decision Framework™ · Market Opportunity Framework™ ·
Capital Readiness Framework™ · Acquisition Readiness Framework™ ·
Innovation Pipeline Framework™ · Operational Excellence Framework™

Each framework is a structured JSON template in `backend/app/frameworks/`. The engine never
freeform-prompts — every generation injects a framework (the Phase 5 moat design).

## Quick start (local dev)

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # add your ANTHROPIC_API_KEY and Stripe keys
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

Or run everything with Docker: `docker compose up --build`

> **Demo mode:** with no `ANTHROPIC_API_KEY` the engine returns clearly-labeled
> structural sample output, and with no `STRIPE_SECRET_KEY` the funnel checkout
> fulfills orders instantly — so the entire product flow is testable locally
> with zero keys. Set real keys before going live.

## Environment keys you need

| Key | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks (endpoint: `POST /funnel/webhook`, event: `checkout.session.completed`) |

For local webhook testing: `stripe listen --forward-to localhost:8000/funnel/webhook`

## Deployment (per Final Execution Checklist)

1. **Frontend → Vercel**: import repo, root = `frontend/`, set `NEXT_PUBLIC_API_URL`.
2. **Backend → Render / Fly.io**: root = `backend/`, start command `uvicorn app.main:app --host 0.0.0.0 --port 8000`, set env vars.
3. **Database → Supabase / Neon**: set `DATABASE_URL` to the Postgres URL.
4. **Stripe live mode**: add the webhook endpoint `https://your-backend/funnel/webhook`.
5. **Go-live test**: landing → idea → preview → pay (test card 4242…) → success page → PDF download.

## API overview

- `POST /funnel/preview` — free Idea Score + outline (lead magnet)
- `POST /funnel/checkout` — Stripe Checkout for $29/$99/$199 packs
- `POST /funnel/webhook` — Stripe webhook; generates the deliverable
- `GET  /funnel/order/{id}` / `GET /funnel/order/{id}/pdf`
- `POST /auth/signup` · `POST /auth/login` · `GET /auth/me`
- `POST /projects` · `GET /projects` · `GET /projects/{id}`
- `POST /projects/{id}/generate` — run any intelligence module
- `GET  /vault` · `POST /documents/{id}/edit` · `GET /documents/{id}/pdf`
- `POST /billing/subscribe` · `POST /billing/portal` — SaaS subscriptions

---

© TyRey Technologies, Inc. Outputs are planning tools, not guarantees of business success or financial/legal advice.
