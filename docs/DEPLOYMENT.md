# Deployment

One codebase, one deployment. Production is live at
**https://tyreytechnologies.com**.

## Environments

| Piece | Where | How it deploys |
|---|---|---|
| Frontend | Vercel (`rootDirectory=frontend`) | **Automatic** on every push to `main` |
| Backend | Render `tyrey-backend` (tyrey-backend.onrender.com) | [deploy-backend.yml](../.github/workflows/deploy-backend.yml) via Render deploy hook, or manually in the Render dashboard |
| Database | Render Postgres `tyrey-db` | Managed; migrations run at release (below) |
| DNS | Vercel DNS (GoDaddy nameservers → `ns1/ns2.vercel-dns.com`) | — |
| Payments | Stripe (webhook → `POST /funnel/webhook`) | — |

The Render web service and database are declared in
[render.yaml](../render.yaml) (Render Blueprint). Local containers:
[docker-compose.yml](../docker-compose.yml).

### Enabling automatic backend deploys

1. Render dashboard → `tyrey-backend` → Settings → **Deploy Hook** → copy URL.
2. GitHub repo → Settings → Secrets and variables → Actions → new secret
   `RENDER_DEPLOY_HOOK` with that URL.

Until the secret exists, the workflow skips gracefully and backend deploys
stay manual ("Deploy latest commit" in the Render dashboard).

## Environment variables

Templates are the contract — update them in the same PR as any new setting:

- Backend: [backend/.env.example](../backend/.env.example)
- Frontend: [frontend/.env.local.example](../frontend/.env.local.example) (`NEXT_PUBLIC_API_URL`)

Never commit real values. Production values live in the Render dashboard
(backend) and Vercel project settings (frontend).

## Database migrations

Schema changes ship as Alembic migrations in `backend/migrations/versions/`.

```bash
cd backend
alembic revision -m "add column x to orders"   # write the migration by hand, or
alembic revision --autogenerate -m "..."       # generate from models.py, then review
alembic upgrade head                           # apply locally
```

Release process for a schema change:

1. Merge the PR (CI already applied the migration to a scratch DB and ran
   `alembic check`).
2. Run the migration against production **before** the new backend code serves
   traffic: from a machine with the prod `DATABASE_URL`
   (Render dashboard → tyrey-db → connection string):
   `DATABASE_URL=postgresql://... alembic upgrade head`
3. Deploy the backend.

> **Existing databases** created before Alembic (via `create_all`) should be
> stamped once instead of migrated: `alembic stamp head`.

## Going fully live (revenue checklist)

Current state: Stripe is in **test mode**; Render is on the **free tier**
(spins down when idle; free Postgres expires **2026-08-03**).

1. Stripe: swap `STRIPE_SECRET_KEY` to the live key; create a live webhook for
   `checkout.session.completed` → `https://tyrey-backend.onrender.com/funnel/webhook`;
   update `STRIPE_WEBHOOK_SECRET`; create live Prices and set
   `STRIPE_PRICE_{STARTER,PRO,EXECUTIVE}`.
2. Render: upgrade the web service (no idle spin-down) and Postgres (no expiry).
3. Smoke-test the money path in production: idea → preview → pay (real card,
   then refund) → success page → PDF download.

## Rollback

- **Frontend**: Vercel dashboard → Deployments → promote a previous deployment.
- **Backend**: Render dashboard → Deploys → "Rollback" (or redeploy an earlier
  commit).
- **Schema**: `alembic downgrade -1` — but prefer roll-forward; downgrades that
  drop columns lose data.

## Local production-parity check

```bash
docker compose up --build   # backend :8000, frontend :3000, both containerized
cd backend && python tests/smoke_test.py
```
