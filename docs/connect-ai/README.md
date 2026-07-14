# TyRey Connect AI™ — Build Package

**"The Intelligent Communications Platform for Modern Business"**

This folder is the complete handoff package for building TyRey Connect AI
inside the existing `tyrey-technologies` monorepo. It is written to be
executed by Claude Code (or any engineer) phase by phase.

## What Connect AI is

A communications + AI + CRM platform sold as a finished product, not an API.
Twilio serves developers building communications into their own applications;
Connect AI serves businesses that want an integrated communications, CRM, and
AI platform with minimal technical setup. We compete on simplicity and
AI-driven productivity, not API breadth.

Core capabilities (full detail in `PRODUCT-SPEC.md`): SMS/MMS, voice, email,
WhatsApp, video, AI receptionists/sales/support agents, unified inbox,
built-in CRM, marketing automation, visual workflow automation, analytics,
and (later) public developer APIs.

## What already exists

- **Marketing page** — `frontend/src/app/connect-ai/page.tsx`, wired into the
  site nav (`Site.tsx`) and homepage (`page.tsx`). Lead capture posts to the
  existing `POST /leads` endpoint with `service: "connect-ai"`. Shipped with
  this package; no backend change was needed.
- **This spec package** — product spec, architecture, and phased roadmap.

## Package contents

| File | Purpose |
|---|---|
| `PRODUCT-SPEC.md` | Vision, positioning, modules, feature-by-feature detail |
| `ARCHITECTURE.md` | How Connect AI integrates into this monorepo: data model, provider adapter, API surface, AI-engine integration |
| `ROADMAP.md` | Phased build plan with concrete, check-off-able tasks |

## Rules of engagement (non-negotiable)

All work follows the repo's `CLAUDE.md`. In particular:

1. **This is one codebase.** Connect AI is a module of the existing frontend
   (`frontend/src/app/connect-ai/`, dashboard routes under
   `frontend/src/app/dashboard/connect/`) and backend
   (`backend/app/connect/`). No new repo, no new framework.
2. **Provider-agnostic carrier layer.** All telephony/messaging goes through
   the adapter in `backend/app/connect/providers/` (see ARCHITECTURE.md).
   Start with Twilio as the first adapter; never call a provider SDK outside
   the adapter. This mirrors how `llm.py` isolates the Anthropic SDK.
3. **Demo mode is mandatory.** Every Connect AI path must work without
   provider keys (labeled simulated sends/calls), exactly like the AI demo
   mode. Tests run in demo mode — no keys, ever.
4. **AI goes through the engine.** Conversation AI uses `ai_engine.py` with
   framework JSONs in `backend/app/frameworks/` (e.g.
   `connect_receptionist.json`). Never freeform-prompt, never call the
   anthropic SDK outside `llm.py`.
5. **Ownership isolation.** Every query filters by `user_id` (workspace
   scoping comes with the Workspace model — see ARCHITECTURE.md).
6. **Alembic migration with every schema change; tests with every endpoint;
   `ruff check . && pytest` and `npx tsc --noEmit && npm run build` green
   before done.**
7. **Pricing** is fixed by the business: Connect $495/mo, Connect Executive
   $995/mo, Enterprise/White Label custom — usage billed on top. Do not
   invent new public tiers without Ty's sign-off.
8. **Compliance is a feature.** SMS requires 10DLC/toll-free registration;
   calls/recordings have consent requirements (TCPA); marketing sends need
   opt-out handling (STOP keywords, unsubscribe links). Build these in from
   Phase 1, not later.

## Suggested Claude Code kickoff prompt

> Read `CLAUDE.md`, then `docs/connect-ai/README.md`,
> `docs/connect-ai/ARCHITECTURE.md`, and `docs/connect-ai/ROADMAP.md`.
> Execute Phase 1 of the roadmap task by task. Work in demo mode (no
> provider keys). After each task: run backend and frontend checks, and stop
> for review before starting the next phase.
