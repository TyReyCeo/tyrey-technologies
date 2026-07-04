/**
 * TyRey Technologies, Inc. — corporate homepage.
 * Building the Intelligence Infrastructure for Modern Business.
 */
import Link from "next/link";
import { SiteFooter, SiteNav } from "@/components/Site";

const SECTION_PAD = "clamp(24px, 6vw, 72px)";

const SERVICES = [
  {
    href: "/services/due-diligence-studio",
    tag: "Project-based · $2,500–$15,000",
    name: "AI Due Diligence Studio",
    desc: "Investment memorandums, business plans, pitch decks, financial models, and investor outreach packages — delivered in days, not weeks.",
    cta: "Explore the Studio →",
  },
  {
    href: "/services/acquisition-scout",
    tag: "Weekly deal flow · Success fees",
    name: "Acquisition Scout",
    desc: "An AI workflow that surfaces qualified acquisition targets every week — companies for sale, retiring owners, distressed assets, and overlooked opportunities.",
    cta: "See how it works →",
  },
  {
    href: "/services/ceo-in-a-box",
    tag: "Subscription · $995/month",
    name: "CEO in a Box",
    desc: "Your outsourced executive office. Unlimited help with proposals, SOPs, marketing, contract drafts, investor materials, and strategic planning.",
    cta: "View membership →",
  },
];

const WHY = [
  {
    name: "Days, not weeks",
    desc: "Deliverables that traditionally take consulting firms weeks arrive in days — investment memos, business plans, financial models, and market research.",
  },
  {
    name: "Deal flow that compounds",
    desc: "Our Acquisition Scout engine works every week, surfacing qualified targets for private equity firms, family offices, investment banks, and search funds.",
  },
  {
    name: "An executive office on demand",
    desc: "CEO in a Box gives growing businesses unlimited access to executive-grade documents and strategy for a flat monthly rate.",
  },
];

export default function Home() {
  return (
    <main style={{ position: "relative", zIndex: 2 }}>
      <SiteNav />

      {/* ---------- hero ---------- */}
      <section
        style={{
          padding: `clamp(60px, 10vh, 120px) ${SECTION_PAD} 60px`,
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        <p className="eyebrow rise rise-1">TyRey Technologies, Inc.</p>
        <h1
          className="display rise rise-2"
          style={{
            fontSize: "clamp(42px, 6.5vw, 84px)",
            maxWidth: 940,
            margin: "28px 0 26px",
          }}
        >
          Building the{" "}
          <em style={{ color: "var(--brass-bright)", fontStyle: "italic" }}>
            Intelligence Infrastructure
          </em>{" "}
          for Modern Business.
        </h1>
        <p
          className="rise rise-3"
          style={{
            fontSize: 18,
            color: "var(--parchment-dim)",
            maxWidth: 580,
            lineHeight: 1.65,
          }}
        >
          AI-powered strategy, deal flow, and executive support — from a single
          idea to your next acquisition.
        </p>
        <div
          className="rise rise-4"
          style={{ display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap" }}
        >
          <Link href="/intelligence" className="btn">
            Try TyRey Intelligence™ Free →
          </Link>
          <a href="#services" className="btn btn--ghost">
            Explore Our Services
          </a>
        </div>
      </section>

      {/* ---------- flagship platform ---------- */}
      <section style={{ padding: `0 ${SECTION_PAD} 80px`, maxWidth: 1180, margin: "0 auto" }}>
        <div
          className="panel panel--corners rise rise-5"
          style={{
            padding: "clamp(28px, 4vw, 48px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 36,
            alignItems: "center",
          }}
        >
          <div>
            <p className="eyebrow">Flagship Platform</p>
            <h2 className="display" style={{ fontSize: "clamp(26px, 3.4vw, 40px)", margin: "18px 0 12px" }}>
              TyRey Intelligence™
            </h2>
            <p style={{ color: "var(--parchment-dim)", fontSize: 16, lineHeight: 1.65 }}>
              The strategy engine behind everything we build. Describe your idea
              and get an investor-ready business pack — business plan, investor
              memo, market analysis, and your Business Genome™ Score — in under
              10 minutes. Free preview, no credit card.
            </p>
            <div style={{ marginTop: 22, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/intelligence" className="btn">
                Get My Free Idea Score →
              </Link>
              <Link href="/signup" className="btn btn--ghost">
                Full Platform Access
              </Link>
            </div>
          </div>
          <div style={{ display: "grid", gap: 22 }}>
            {[
              ["<10 min", "idea → investor pack"],
              ["4 docs", "per Investor Pack"],
              ["$29+", "starting price"],
            ].map(([stat, label]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                  borderBottom: "1px solid var(--line)",
                  paddingBottom: 14,
                }}
              >
                <span className="display" style={{ fontSize: 34, color: "var(--brass-bright)" }}>
                  {stat}
                </span>
                <span className="mono-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- three service lines ---------- */}
      <section
        id="services"
        style={{ padding: `0 ${SECTION_PAD} 80px`, maxWidth: 1180, margin: "0 auto" }}
      >
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          Services
        </p>
        <h2 className="display" style={{ fontSize: "clamp(26px, 3.4vw, 40px)", marginBottom: 8 }}>
          Three ways we work with you
        </h2>
        <p style={{ color: "var(--parchment-dim)", maxWidth: 620, marginBottom: 30 }}>
          Powered by the TyRey Intelligence engine, delivered with a human touch.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {SERVICES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="panel"
              style={{ padding: 28, display: "flex", flexDirection: "column", gap: 12 }}
            >
              <span className="mono-label" style={{ color: "var(--brass)" }}>
                {s.tag}
              </span>
              <h3 className="display" style={{ fontSize: 22 }}>
                {s.name}
              </h3>
              <p style={{ fontSize: 14.5, color: "var(--parchment-dim)", lineHeight: 1.65, flexGrow: 1 }}>
                {s.desc}
              </p>
              <span className="mono-label" style={{ color: "var(--brass-bright)" }}>
                {s.cta}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- why TyRey ---------- */}
      <section style={{ padding: `0 ${SECTION_PAD} 80px`, maxWidth: 1180, margin: "0 auto" }}>
        <p className="eyebrow" style={{ marginBottom: 10 }}>
          Why TyRey
        </p>
        <h2 className="display" style={{ fontSize: "clamp(26px, 3.4vw, 40px)", marginBottom: 30 }}>
          Speed of AI. Judgment of an operator.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {WHY.map((w) => (
            <div key={w.name} className="panel" style={{ padding: 26 }}>
              <h3 className="display" style={{ fontSize: 19, marginBottom: 8 }}>
                {w.name}
              </h3>
              <p style={{ fontSize: 14.5, color: "var(--parchment-dim)", lineHeight: 1.65 }}>
                {w.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section
        style={{
          padding: `0 ${SECTION_PAD} 90px`,
          maxWidth: 1180,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          className="display"
          style={{ fontSize: "clamp(26px, 3.4vw, 40px)", maxWidth: 700, margin: "0 auto 12px" }}
        >
          Ready to put intelligence to work for your business?
        </h2>
        <p style={{ color: "var(--parchment-dim)", marginBottom: 26 }}>
          Start free with TyRey Intelligence™, or talk to us about a project.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/intelligence" className="btn">
            Start Free →
          </Link>
          <Link href="/services/due-diligence-studio#contact" className="btn btn--ghost">
            Request a Consultation
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
