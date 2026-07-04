# Contributing

Welcome to the TyRey Technologies engineering repo. This guide gets you from
clone to merged PR.

## Dev setup

Prereqs: Python 3.12+, Node 20+, Git. (Docker optional.)

```bash
git clone https://github.com/TyReyCeo/tyrey-technologies.git
cd tyrey-technologies

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env          # runs in demo mode with no keys — that's fine
alembic upgrade head          # create the local SQLite schema
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                   # http://localhost:3000
```

Or: `docker compose up --build`.

> **Demo mode**: with no `ANTHROPIC_API_KEY`/`STRIPE_SECRET_KEY` the app returns
> labeled sample generations and instant dev-mode checkout, so the whole
> product flow works locally with zero secrets.

## Workflow

1. Branch from `main`: `feat/<slug>`, `fix/<slug>`, or `chore/<slug>`.
2. Make the change, following [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md).
3. Verify locally:
   ```bash
   cd backend && ruff check . && pytest        # lint + full API suite
   cd frontend && npx tsc --noEmit && npm run build
   ```
4. Open a PR — the [template](.github/PULL_REQUEST_TEMPLATE.md) is the
   checklist. CI must be green; a CODEOWNERS review is required on protected
   paths (frameworks, billing, auth).
5. Squash-merge. `main` auto-deploys the frontend (Vercel) and, when the
   deploy hook secret is configured, the backend (Render) — so **merging is
   shipping**. Don't merge anything you wouldn't put in front of a customer.

## Where things live

| I want to… | Look at |
|---|---|
| Understand the system | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Add/modify an API endpoint | `backend/app/routers/` + add tests in `backend/tests/test_api.py` |
| Change the schema | `backend/app/models.py` + `alembic revision` ([how](docs/DEPLOYMENT.md#database-migrations)) |
| Touch AI generation | `backend/app/ai_engine.py` + `backend/app/frameworks/` + `backend/evals/` |
| Edit a page | `frontend/src/app/<route>/page.tsx` |
| Deploy or debug prod | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Report a vulnerability | [SECURITY.md](SECURITY.md) — not a public issue |

## Questions

Open a GitHub issue with the appropriate template, or start a discussion in
the PR itself. Security issues go through [SECURITY.md](SECURITY.md) only.
