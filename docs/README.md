# Documentation

## Engineering docs (start here)

| Doc | What it covers |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System overview, route map, backend modules, design decisions |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Environments, secrets, migrations, release + rollback, go-live checklist |
| [CODING_STANDARDS.md](CODING_STANDARDS.md) | Style, patterns, and the review bar |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Dev setup and PR workflow |
| [../SECURITY.md](../SECURITY.md) | Vulnerability reporting and security practices |
| [../CHANGELOG.md](../CHANGELOG.md) | Release history |

## Corporate document set

The founding strategy and build-spec documents for TyRey Intelligence™ live in
the parent folder of this repository (`TyRey Intelligence™/*.docx`):

| Document | Role |
|---|---|
| TyRey Intelligence Master Blueprint v0.1 | Single source of truth for the product |
| TYREY INTELLIGENCE — MVP BUILD SPEC v1.0 | The MVP scope this codebase implements |
| TYREY INTELLIGENCE — STARTER CODEBASE (v1) | Original scaffold spec |
| PHASE 2 (Real SaaS Core) | Users, projects, documents, database |
| PHASE 3 (Frontend System) | Auth UI, dashboard, workspace, viewer |
| PHASE 4 | Stripe billing + production deployment |
| PHASE 5 | Moat engine: the framework IP library |
| PHASE 6–7 (Execution Mode) | Go-to-market and conversion funnel design |
| PHASE 8 (Live Revenue Funnel) | The one-page funnel this repo ships |
| FINAL EXECUTION CHECKLIST | Deployment + go-live steps |
| Product Requirements Document · Investor Package · Ecosystem docs | Corporate set |

The codebase implements the **Phase 8 funnel** at `/intelligence` and the
**MVP Build Spec v1.0** SaaS behind `/dashboard`, with the corporate homepage
at `/` routing every CTA into the product.
