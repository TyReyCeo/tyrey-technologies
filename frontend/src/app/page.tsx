/**
 * TyRey Technologies, Inc. — corporate homepage.
 * "The Firm" — light editorial consultancy design.
 */
import Link from "next/link";
import { SiteFooter, SiteNav } from "@/components/Site";

const SERVICES = [
  {
    href: "/services/due-diligence-studio",
    numeral: "01",
    name: "AI Due Diligence Studio",
    desc: "Investment memorandums, business plans, pitch decks, and financial models — delivered in days, not weeks.",
    tag: "Project · $2,500–$15,000",
  },
  {
    href: "/services/acquisition-scout",
    numeral: "02",
    name: "Acquisition Scout",
    desc: "Qualified acquisition targets surfaced every week — companies for sale, retiring owners, overlooked opportunities.",
    tag: "Weekly deal flow · Success fees",
  },
  {
    href: "/services/ceo-in-a-box",
    numeral: "03",
    name: "CEO in a Box",
    desc: "Your outsourced executive office — unlimited proposals, SOPs, investor materials, and strategic planning.",
    tag: "Subscription · $995/month",
  },
];

const PROOF = [
  ["<10 min", "Idea to investor pack"],
  ["Up to 5 documents", "Per business pack"],
  ["From $29", "No credit card to preview"],
];

const PACK_CONTENTS = [
  "Business Plan",
  "Investor Memo",
  "Market Analysis",
  "Business Genome™ Score",
  "Intelligence Score™",
];

export default function Home() {
  return (
    <main>
      <SiteNav />

      {/* ---------- hero ---------- */}
      <section
        style={{
          padding: "110px var(--section-pad) 90px",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="home-hero-grid">
          <div>
            <p
              className="eyebrow rise rise-1"
              style={{ margin: "0 0 30px" }}
            >
              TyRey Technologies, Inc.
            </p>
            <h1 className="home-hero-h1 rise rise-2">
              The intelligence infrastructure for modern business
              <span style={{ color: "var(--oxblood)" }}>.</span>
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 28,
              paddingBottom: 8,
            }}
          >
            <p
              className="rise rise-3"
              style={{
                margin: 0,
                fontSize: 17,
                lineHeight: 1.7,
                color: "var(--ink-soft)",
              }}
            >
              AI-powered strategy, deal flow, and executive support — from a
              single idea to your next acquisition.
            </p>
            <div
              className="rise rise-4"
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <Link href="/intelligence" className="btn">
                Get your free Idea Score
              </Link>
              <Link
                href="/services/due-diligence-studio#contact"
                className="btn btn--ghost"
              >
                Talk to us about a project
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- photo band ---------- */}
      <div
        style={{
          borderBottom: "1px solid var(--rule)",
          height: 440,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80"
          alt="Modern glass office architecture"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "sepia(0.22) contrast(1.02) brightness(1.02)",
          }}
        />
      </div>

      {/* ---------- proof strip ---------- */}
      <div className="proof-strip">
        {PROOF.map(([stat, caption]) => (
          <div key={caption}>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: 44,
                lineHeight: 1.1,
              }}
            >
              {stat}
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-faint)",
              }}
            >
              {caption}
            </p>
          </div>
        ))}
      </div>

      {/* ---------- services ledger ---------- */}
      <section
        style={{
          padding: "80px var(--section-pad)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="ledger-grid">
          <div>
            <p className="eyebrow" style={{ margin: "0 0 16px" }}>
              Services
            </p>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: 44,
                lineHeight: 1.1,
              }}
            >
              Three ways we work with you
            </h2>
            <p
              style={{
                margin: "20px 0 0",
                fontSize: 15,
                lineHeight: 1.7,
                color: "var(--ink-soft)",
              }}
            >
              Powered by the TyRey Intelligence engine, delivered with a human
              touch.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80"
              alt="Advisors in discussion"
              style={{
                width: "100%",
                height: 280,
                objectFit: "cover",
                marginTop: 36,
                filter: "sepia(0.22) contrast(1.02)",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {SERVICES.map((s) => (
              <Link key={s.href} href={s.href} className="ledger-row">
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 28,
                    color: "var(--numeral)",
                  }}
                >
                  {s.numeral}
                </span>
                <div>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 400,
                      fontSize: 26,
                    }}
                  >
                    {s.name}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: "var(--ink-soft)",
                    }}
                  >
                    {s.desc}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--oxblood)",
                  }}
                >
                  {s.tag}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- flagship band (inverted) ---------- */}
      <section
        style={{
          padding: "80px var(--section-pad)",
          background: "var(--ink)",
          color: "var(--paper-on-ink)",
        }}
      >
        <div className="flagship-grid">
          <div>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: 13,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--oxblood-tint)",
                fontWeight: 600,
              }}
            >
              Flagship platform
            </p>
            <h2
              style={{
                margin: "0 0 18px",
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: 52,
                lineHeight: 1.05,
              }}
            >
              TyRey Intelligence™
            </h2>
            <p
              style={{
                margin: "0 0 30px",
                fontSize: 16,
                lineHeight: 1.7,
                color: "var(--dim-on-ink)",
                maxWidth: 560,
              }}
            >
              Describe your idea and receive an investor-ready business pack —
              business plan, investor memo, market analysis, and your Business
              Genome™ Score — in under ten minutes.
            </p>
            <Link href="/intelligence" className="btn btn--paper">
              Start free — no credit card
            </Link>
          </div>
          <div
            style={{
              border: "1px solid rgba(250,247,241,0.2)",
              padding: 36,
            }}
          >
            <p
              style={{
                margin: "0 0 24px",
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--oxblood-tint)",
              }}
            >
              What&apos;s in a pack
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {PACK_CONTENTS.map((item, i) => (
                <span
                  key={item}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 21,
                    borderBottom:
                      i < PACK_CONTENTS.length - 1
                        ? "1px solid rgba(250,247,241,0.14)"
                        : "none",
                    paddingBottom: i < PACK_CONTENTS.length - 1 ? 14 : 0,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section
        style={{
          padding: "90px var(--section-pad)",
          textAlign: "center",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <h2
          style={{
            margin: "0 auto 14px",
            maxWidth: 720,
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 48,
            lineHeight: 1.1,
          }}
        >
          Ready to put intelligence to work?
        </h2>
        <p style={{ margin: "0 0 32px", color: "var(--ink-soft)", fontSize: 16 }}>
          Start free with TyRey Intelligence™, or talk to us about a project.
        </p>
        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link href="/intelligence" className="btn btn--accent">
            Start free
          </Link>
          <Link
            href="/services/due-diligence-studio#contact"
            className="btn btn--ghost"
          >
            Request a consultation
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
