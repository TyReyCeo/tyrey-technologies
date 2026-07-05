"use client";

/**
 * Shared marketing-site components: nav, footer, lead-capture form.
 * Used by the corporate homepage and the three service pages.
 */
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

const NAV_LINKS = [
  { href: "/intelligence", label: "Intelligence Platform" },
  { href: "/services/due-diligence-studio", label: "Due Diligence Studio" },
  { href: "/services/acquisition-scout", label: "Acquisition Scout" },
  { href: "/services/ceo-in-a-box", label: "CEO in a Box" },
];

export function SiteNav() {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "26px var(--section-pad)",
        borderBottom: "1px solid var(--rule)",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 24,
          letterSpacing: "0.01em",
          color: "var(--ink)",
        }}
      >
        TyRey Technologies
      </Link>
      <nav className="nav-links">
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
        <Link
          href="/login"
          style={{
            fontSize: 14,
            color: "var(--oxblood)",
            borderBottom: "1px solid var(--oxblood)",
            paddingBottom: 2,
          }}
        >
          Sign in
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "32px var(--section-pad)",
        fontSize: 13,
        color: "var(--ink-faint)",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 17,
          color: "var(--ink)",
        }}
      >
        TyRey Technologies, Inc.
      </span>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        <Link href="/terms" style={{ color: "var(--ink-faint)" }}>
          Terms
        </Link>
        <Link href="/privacy" style={{ color: "var(--ink-faint)" }}>
          Privacy
        </Link>
        <span>
          © {new Date().getFullYear()} — Outputs are planning tools, not
          financial or legal advice.
        </span>
      </div>
    </footer>
  );
}

/** Lead-capture form. Posts to the backend /leads endpoint. */
export function LeadForm({
  service,
  heading = "Request a consultation",
  buttonLabel = "Request Consultation →",
}: {
  service: string;
  heading?: string;
  buttonLabel?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async () => {
    setStatus("sending");
    setError("");
    try {
      await api("/leads", {
        method: "POST",
        body: { service, name, email, company, message },
      });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — try again.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div
        className="panel"
        id="contact"
        style={{ padding: "clamp(28px, 4vw, 44px)", textAlign: "center" }}
      >
        <p className="eyebrow">Request received</p>
        <h3 className="display" style={{ fontSize: 26, margin: "16px 0 10px" }}>
          Thanks, {name.split(" ")[0] || "there"}.
        </h3>
        <p style={{ color: "var(--ink-soft)" }}>
          We&apos;ll be in touch at {email} within one business day.
        </p>
      </div>
    );
  }

  return (
    <div
      className="panel"
      id="contact"
      style={{ padding: "clamp(28px, 4vw, 44px)" }}
    >
      <h3 className="display" style={{ fontSize: 26, marginBottom: 24 }}>
        {heading}
      </h3>
      <div style={{ display: "grid", gap: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          <div className="field">
            <label htmlFor={`${service}-name`}>Your name</label>
            <input
              id={`${service}-name`}
              placeholder="Jane Founder"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`${service}-email`}>Email</label>
            <input
              id={`${service}-email`}
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor={`${service}-company`}>Company (optional)</label>
          <input
            id={`${service}-company`}
            placeholder="Acme Inc."
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${service}-message`}>What do you need?</label>
          <textarea
            id={`${service}-message`}
            rows={3}
            placeholder="Tell us about your project, timeline, and goals…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {error && <div className="error-note">{error}</div>}

        <div>
          <button
            className="btn"
            onClick={submit}
            disabled={status === "sending" || !email || !name.trim()}
          >
            {status === "sending" ? (
              <>
                <span className="spin" /> Sending…
              </>
            ) : (
              buttonLabel
            )}
          </button>
        </div>
        <p className="mono-label">No commitment. We reply within one business day.</p>
      </div>
    </div>
  );
}
