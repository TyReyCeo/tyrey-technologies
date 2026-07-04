# Security policy

## Reporting a vulnerability

**Do not open a public issue for security problems.**

Report privately via
[GitHub Security Advisories](https://github.com/TyReyCeo/tyrey-technologies/security/advisories/new)
or email **tywilliams729@gmail.com** with subject line `SECURITY: <summary>`.

Include what you found, where (URL/endpoint/file), and reproduction steps.
You'll get an acknowledgment within 2 business days. Please give us a
reasonable window to fix before any public disclosure.

## Scope

- https://tyreytechnologies.com and www subdomain
- https://tyrey-backend.onrender.com (API)
- This repository's code

Out of scope: denial-of-service, volumetric attacks, social engineering,
and issues in third-party platforms themselves (Vercel, Render, Stripe,
Anthropic) — report those upstream.

## What we care about most

- Authentication/JWT flaws, session issues
- **Cross-tenant data access** (one user reading another's projects,
  documents, or orders)
- Stripe webhook forgery or payment bypass
- Prompt-injection paths that exfiltrate other users' data through the AI
  engine
- Leaked secrets in code, logs, or responses

## Handling practices in this repo

- Secrets live only in environment variables (Render/Vercel dashboards);
  `.env*` files are gitignored and templated.
- Passwords are hashed; auth is JWT bearer tokens.
- Every authenticated query is scoped to the requesting user; the smoke suite
  asserts ownership isolation.
- Stripe webhooks are signature-verified with `STRIPE_WEBHOOK_SECRET`.
- Dependencies are updated weekly via Dependabot.
