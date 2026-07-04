/**
 * Shared template for the three TyRey service pages:
 * Due Diligence Studio, Acquisition Scout, CEO in a Box.
 */
import Link from "next/link";
import { ReactNode } from "react";
import { LeadForm, SiteFooter, SiteNav } from "./Site";

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  items: string[];
  featured?: boolean;
}

const SECTION_PAD = "clamp(24px, 6vw, 72px)";

export default function ServicePage({
  slug,
  badge,
  title,
  titleAccent,
  subtitle,
  deliverablesHeading,
  deliverables,
  audienceHeading,
  audience,
  pricing,
  pricingNote,
  formHeading,
  children,
}: {
  slug: string;
  badge: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  deliverablesHeading: string;
  deliverables: { name: string; desc: string }[];
  audienceHeading: string;
  audience: string[];
  pricing: PricingTier[];
  pricingNote?: string;
  formHeading: string;
  children?: ReactNode;
}) {
  return (
    <main style={{ position: "relative", zIndex: 2 }}>
      <SiteNav />

      {/* ---------- hero ---------- */}
      <section
        style={{
          padding: `clamp(56px, 9vh, 110px) ${SECTION_PAD} 56px`,
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        <p className="eyebrow rise rise-1">{badge}</p>
        <h1
          className="display rise rise-2"
          style={{
            fontSize: "clamp(38px, 5.6vw, 72px)",
            maxWidth: 880,
            margin: "26px 0 24px",
          }}
        >
          {title}{" "}
          <em style={{ color: "var(--brass-bright)", fontStyle: "italic" }}>
            {titleAccent}
          </em>
        </h1>
        <p
          className="rise rise-3"
          style={{
            fontSize: 18,
            color: "var(--parchment-dim)",
            maxWidth: 620,
            lineHeight: 1.65,
          }}
        >
          {subtitle}
        </p>
        <div
          className="rise rise-4"
          style={{ display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap" }}
        >
          <a href="#contact" className="btn">
            Get Started →
          </a>
          <a href="#pricing" className="btn btn--ghost">
            See Pricing
          </a>
        </div>
      </section>

      {/* ---------- deliverables ---------- */}
      <section style={{ padding: `20px ${SECTION_PAD} 70px`, maxWidth: 1180, margin: "0 auto" }}>
        <p className="eyebrow" style={{ marginBottom: 26 }}>
          {deliverablesHeading}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {deliverables.map((d) => (
            <div key={d.name} className="panel" style={{ padding: 26 }}>
              <h3 className="display" style={{ fontSize: 19, marginBottom: 8 }}>
                {d.name}
              </h3>
              <p style={{ fontSize: 14.5, color: "var(--parchment-dim)", lineHeight: 1.65 }}>
                {d.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* extra custom content per service */}
      {children}

      {/* ---------- audience ---------- */}
      <section style={{ padding: `0 ${SECTION_PAD} 70px`, maxWidth: 1180, margin: "0 auto" }}>
        <p className="eyebrow" style={{ marginBottom: 22 }}>
          {audienceHeading}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {audience.map((a) => (
            <span
              key={a}
              className="mono-label"
              style={{
                border: "1px solid var(--line-strong)",
                padding: "10px 18px",
                color: "var(--parchment)",
              }}
            >
              {a}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- pricing ---------- */}
      <section
        id="pricing"
        style={{ padding: `0 ${SECTION_PAD} 80px`, maxWidth: 1180, margin: "0 auto" }}
      >
        <p className="eyebrow" style={{ marginBottom: 26 }}>
          Pricing
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {pricing.map((p) => (
            <div
              key={p.name}
              className={`panel${p.featured ? " panel--corners" : ""}`}
              style={{
                padding: 30,
                display: "flex",
                flexDirection: "column",
                gap: 18,
                borderColor: p.featured ? "var(--brass)" : undefined,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span
                  className="mono-label"
                  style={{ color: p.featured ? "var(--brass-bright)" : undefined }}
                >
                  {p.name}
                </span>
                {p.featured && (
                  <span className="mono-label" style={{ color: "var(--emerald)", fontSize: 10 }}>
                    Most popular
                  </span>
                )}
              </div>
              <div className="display" style={{ fontSize: 40 }}>
                {p.price}
                {p.period && (
                  <span className="mono-label" style={{ marginLeft: 8 }}>
                    {p.period}
                  </span>
                )}
              </div>
              <ul style={{ listStyle: "none", display: "grid", gap: 8, flexGrow: 1 }}>
                {p.items.map((i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 10,
                      fontSize: 14.5,
                      color: "var(--parchment-dim)",
                    }}
                  >
                    <span style={{ color: "var(--brass)" }}>—</span> {i}
                  </li>
                ))}
              </ul>
              <a href="#contact" className={`btn${p.featured ? "" : " btn--ghost"}`}>
                Get Started
              </a>
            </div>
          ))}
        </div>
        {pricingNote && (
          <p
            style={{
              marginTop: 22,
              fontSize: 14,
              color: "var(--parchment-dim)",
              maxWidth: 640,
              lineHeight: 1.65,
            }}
          >
            {pricingNote}
          </p>
        )}
      </section>

      {/* ---------- lead form ---------- */}
      <section style={{ padding: `0 ${SECTION_PAD} 90px`, maxWidth: 760, margin: "0 auto" }}>
        <LeadForm service={slug} heading={formHeading} />
        <p
          className="mono-label"
          style={{ textAlign: "center", marginTop: 22, letterSpacing: "0.14em" }}
        >
          Not sure yet?{" "}
          <Link href="/intelligence" style={{ color: "var(--brass)" }}>
            Try TyRey Intelligence™ free
          </Link>{" "}
          and see the engine behind our work.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
