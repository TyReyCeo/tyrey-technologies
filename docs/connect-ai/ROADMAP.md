# TyRey Connect AI™ — Build Roadmap

Phased plan sized for AI-assisted development. Each phase ends with the
repo's definition of done: `ruff check . && pytest` green, frontend
type-check/build green, docs updated, no secrets or dead code. Ship each
phase from a feature branch after review — merging to `main` is shipping.

## Phase 0 — Marketing & spec ✅ (shipped with this package)

- [x] Public product page `/connect-ai` in house style
- [x] Nav + homepage integration, site metadata updated
- [x] Lead capture via existing `POST /leads` (`service: "connect-ai"`)
- [x] Spec package in `docs/connect-ai/`

## Phase 1 — Messaging core (target: 3–4 months of nights-and-weekends, or ~2–4 weeks AI-assisted full-time)

Goal: a customer can sign in, get a (demo) number, import contacts, text
two-way from a unified inbox with AI drafts, and see usage. Everything works
keyless in demo mode; flipping `CONNECT_PROVIDER=twilio` makes it real.

Backend

- [x] `backend/app/connect/` scaffold + router registered in `main.py`
- [x] Models + Alembic migration (0002): ConnectNumber, Contact, Conversation,
      Message, UsageRecord (fields per ARCHITECTURE.md §4) + ConnectProfile
      (business profile / AI kill switch backing the Settings page)
- [x] Provider layer: `base.py` protocol, `demo.py` (default), factory +
      settings (`CONNECT_PROVIDER`, Twilio vars in `.env.example`)
- [x] Twilio adapter: send SMS/MMS, provision/release number, webhook
      signature verification (only file importing `twilio`; signatures are
      verified with `TWILIO_AUTH_TOKEN` per Twilio's scheme — no separate
      webhook secret exists)
- [x] Endpoints per ARCHITECTURE.md §5 with Pydantic validation, ownership
      filtering, and tests (happy + auth/ownership failure each)
- [x] Inbound + status webhooks, idempotent on `provider_sid`, with tests
- [x] Compliance: STOP/HELP/START keyword handling before AI; `sms_opt_out`
      enforced on every outbound; registration-status gate on real sends
      (+ admin endpoint to flip registration status); per-user send rate limit
- [x] Usage metering on send/receive; `GET /connect/usage/summary`
- [x] AI: `connect_reply_draft.json` + `connect_summarize.json` frameworks,
      `/ai-draft` endpoint, golden-set entries, demo-mode outputs
- [x] AI: `connect_receptionist.json` + auto-reply policy
      (`ai_enabled` gate, AI-authored messages labeled)

Frontend

- [x] `dashboard/connect/` overview page (number, usage, recent threads)
- [x] Inbox: conversation list + thread view, send box, AI-draft button
      (insert-to-edit, explicit send), status/assign controls, ~10s polling
- [x] Contacts: list/search, add/edit, CSV import with validation feedback,
      opt-out visibility
- [x] Settings: AI on/off, business profile that feeds the receptionist,
      number provisioning UI
- [x] Dashboard nav entry; demo-mode banner when simulated

Release

- [x] Stripe plan gating on Connect routes (`connect` / `connect_executive`
      plans; gate active only when Stripe is configured so keyless dev demo
      keeps working). Manual step remaining: create the two recurring prices
      in the Stripe Dashboard and set `STRIPE_PRICE_CONNECT` /
      `STRIPE_PRICE_CONNECT_EXECUTIVE` on Render.
- [x] Docs: `docs/ARCHITECTURE.md` module list updated + this file's
      checkboxes; admin runbook: [REGISTRATION-RUNBOOK.md](REGISTRATION-RUNBOOK.md)
- [ ] Early-access onboarding: convert `connect-ai` leads manually

## Phase 2 — Voice, AI receptionist & CRM (2–3 months classic / 3–6 weeks AI-assisted)

- [ ] Workspace + WorkspaceMember models; migration backfilling one
      workspace per user; scoping moves to workspace membership; seat
      limits by plan (3 / 10 / custom)
- [ ] VoiceProvider adapter (Twilio first): numbers answer via webhook call
      control; CallRecord model + migration
- [ ] IVR + AI receptionist for voice (speech-to-text → engine → text-to-
      speech), voicemail + transcription, recording with consent setting
- [ ] Call log UI + in-thread call entries (calls join conversations)
- [ ] CRM: Deal, Pipeline, Task models + migrations; pipeline board,
      contact timeline (all channels + calls + notes), AI next-action
      recommendations on deals
- [ ] Admin: number provisioning oversight, per-workspace usage, volume
      anomaly alerts
- [ ] Metered usage reported to Stripe (per-segment SMS, per-minute voice)

## Phase 3 — Email, marketing automation & analytics (2–3 months classic / 3–6 weeks AI-assisted)

- [ ] Email channel behind the provider adapter pattern (e.g. Resend/SES —
      justify the dependency); transactional + campaign sends; EmailEvent
      tracking (delivered/open/click); unsubscribe compliance
- [ ] Campaigns: Campaign, CampaignRecipient, Segment models; SMS + email
      campaign builder with scheduling, A/B test variants, AI copywriting
      via new framework JSONs; opt-out enforcement at send time
- [ ] Drip sequences + visual workflow builder (Workflow definition JSON,
      WorkflowRun executor with triggers/waits/branches/AI-evaluate steps)
- [ ] Analytics dashboard: messages, calls, conversions, campaign ROI, AI
      containment/escalation, team activity
- [ ] QR code generator for campaign entry points

## Phase 4 — WhatsApp, video, developer platform & white label (3–4 months classic / 6–8 weeks AI-assisted)

- [ ] WhatsApp Business API channel (template approval flow, broadcasts)
- [ ] Video meetings (provider-backed, e.g. Daily/LiveKit — justify), with
      recording, captions, AI meeting summaries via framework
- [ ] Public API: workspace API keys with scopes + rate limits; messaging,
      contacts, webhooks, AI endpoints; OpenAPI-generated docs; SDKs
      (JS + Python first, then Java/C#/PHP/Go) generated from the schema
- [ ] White label: reseller accounts, custom domain/branding per workspace,
      volume pricing; admin revenue reporting
- [ ] Enterprise: SSO (this is the trigger for the managed-auth migration
      per CLAUDE.md), custom AI training on customer knowledge bases,
      support SLAs

## Later / opportunistic

- Native mobile apps (Flutter) once web PMF is proven
- Second carrier adapter (Telnyx/Sinch) for redundancy and margin
- Landing-page builder, customer-satisfaction surveys, direct carrier
  evaluation at scale

## Standing risks to watch

1. **10DLC/toll-free registration lead time** — start registration during
   Phase 1 development, not at launch.
2. **TCPA/consent exposure** — opt-out enforcement is tested code, not
   policy text.
3. **AI answering wrongly on behalf of businesses** — confidence
   thresholds, escalation defaults, per-workspace kill switch, golden-set
   evals from day one.
4. **Usage-billing drift** — reconcile UsageRecords against provider logs
   monthly (admin report).
