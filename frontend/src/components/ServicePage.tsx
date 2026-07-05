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

export default function ServicePage({
  slug,
  badge,
  title,
  titleAccent,
  subtitle,
  image,
  imageAlt,
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
  image?: string;
  imageAlt?: string;
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
    <main>
      <SiteNav />

      {/* ---------- hero ---------- */}
      <section
        style={{
          padding: "90px var(--section-pad) 70px",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="service-hero-grid">
          <div>
            <p className="eyebrow rise rise-1" style={{ margin: "0 0 26px" }}>
              {badge}
            </p>
            <h1
              className="rise rise-2"
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: "clamp(38px, 4.6vw, 64px)",
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
              }}
            >
              {title}{" "}
              <em style={{ color: "var(--oxblood)" }}>{titleAccent}</em>
            </h1>
          </div>
          <div
            className="rise rise-3"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 26,
              paddingBottom: 8,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 17,
                lineHeight: 1.7,
                color: "var(--ink-soft)",
              }}
            >
              {subtitle}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <a href="#contact" className="btn">
                Get started
              </a>
              <a href="#pricing" className="btn btn--ghost">
                See pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- photo band ---------- */}
      {image && (
        <div
          style={{
            borderBottom: "1px solid var(--rule)",
            height: 360,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={imageAlt ?? ""}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "sepia(0.22) contrast(1.02) brightness(1.02)",
            }}
          />
        </div>
      )}

      {/* ---------- deliverables ---------- */}
      <section
        style={{
          padding: "70px var(--section-pad)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
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
              <h3
                className="display"
                style={{ fontSize: 22, marginBottom: 8 }}
              >
                {d.name}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--ink-soft)",
                  lineHeight: 1.65,
                }}
              >
                {d.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* extra custom content per service */}
      {children}

      {/* ---------- audience ---------- */}
      <section
        style={{
          padding: "70px var(--section-pad)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <p className="eyebrow" style={{ marginBottom: 22 }}>
          {audienceHeading}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {audience.map((a) => (
            <span
              key={a}
              style={{
                border: "1px solid var(--rule)",
                padding: "10px 18px",
                fontSize: 13,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink)",
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
        style={{
          padding: "70px var(--section-pad)",
          borderBottom: "1px solid var(--rule)",
        }}
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
          {pricing.map((p, i) => (
            <div
              key={p.name}
              className="panel"
              style={{
                padding: 30,
                display: "flex",
                flexDirection: "column",
                gap: 18,
                borderColor: p.featured ? "var(--oxblood)" : undefined,
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
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 24,
                    color: "var(--numeral)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p.featured && (
                  <span
                    className="mono-label"
                    style={{ color: "var(--oxblood)", fontSize: 11 }}
                  >
                    Most popular
                  </span>
                )}
              </div>
              <span
                className="mono-label"
                style={{ color: p.featured ? "var(--oxblood)" : undefined }}
              >
                {p.name}
              </span>
              <div className="display" style={{ fontSize: 40 }}>
                {p.price}
                {p.period && (
                  <span className="mono-label" style={{ marginLeft: 8 }}>
                    {p.period}
                  </span>
                )}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  display: "grid",
                  gap: 8,
                  flexGrow: 1,
                }}
              >
                {p.items.map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      gap: 10,
                      fontSize: 14.5,
                      color: "var(--ink-soft)",
                      borderBottom: "1px solid var(--rule)",
                      paddingBottom: 8,
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`btn${p.featured ? " btn--accent" : " btn--ghost"}`}
              >
                Get started
              </a>
            </div>
          ))}
        </div>
        {pricingNote && (
          <p
            style={{
              marginTop: 22,
              fontSize: 14,
              color: "var(--ink-soft)",
              maxWidth: 640,
              lineHeight: 1.65,
            }}
          >
            {pricingNote}
          </p>
        )}
      </section>

      {/* ---------- lead form ---------- */}
      <section
        style={{
          padding: "70px var(--section-pad) 90px",
          maxWidth: 860,
          margin: "0 auto",
        }}
      >
        <LeadForm service={slug} heading={formHeading} />
        <p
          className="mono-label"
          style={{ textAlign: "center", marginTop: 22 }}
        >
          Not sure yet?{" "}
          <Link href="/intelligence" style={{ color: "var(--oxblood)" }}>
            Try TyRey Intelligence™ free
          </Link>{" "}
          and see the engine behind our work.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
