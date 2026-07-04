## Summary

<!-- What does this PR do, and why? One or two sentences. -->

## Changes

<!-- Bullet the notable changes. Small PRs are easier to review — aim for one concern per PR. -->

-

## How was this tested?

<!-- Check all that apply and describe anything manual. -->

- [ ] `python tests/smoke_test.py` passes (backend)
- [ ] `python evals/run_evals.py` passes (if AI-engine or framework changes)
- [ ] `npx tsc --noEmit` and `npm run build` pass (frontend)
- [ ] Verified manually in the browser (describe below)

## Checklist

- [ ] No secrets, API keys, or `.env` values in the diff
- [ ] Database schema changes include an Alembic migration (`backend/migrations/versions/`)
- [ ] New endpoints are covered by the smoke suite
- [ ] User-facing copy keeps the legal disclaimer where required ("planning tools, not guarantees…")
- [ ] Docs updated if behavior changed ([README](../README.md), [docs/](../docs/))
