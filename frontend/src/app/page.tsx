"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Markdown from "@/components/Markdown";
import { api } from "@/lib/api";

const TIERS = [
  {
    id: "starter",
    price: "$29",
    label: "Starter Pack",
    includes: ["Business Plan", "Market Overview"],
  },
  {
    id: "investor",
    price: "$99",
    label: "Investor Pack",
    flagship: true,
    includes: ["Full Business Plan", "Investor Memo", "Market Analysis"],
  },
  {
    id: "founder",
    price: "$199",
    label: "Founder Premium",
    includes: [
      "Everything in Investor",
      "Business Genome™ Score",
      "Intelligence Score™",
    ],
  },
];

export default function Home() {
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("idea");
  const [email, setEmail] = useState("");

  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState("");
  const [error, setError] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const generatePreview = async () => {
    setError("");
    if (idea.trim().length < 10 || !industry.trim()) {
      setError("Describe your idea (at least a sentence) and industry first.");
      return;
    }
    setLoading(true);
    try {
      const data = await api<{ content: string }>("/funnel/preview", {
        method: "POST",
        body: { idea, industry, stage },
      });
      setPreview(data.content);
      setTimeout(
        () => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        60
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed — try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkout = async (tier: string) => {
    setError("");
    setCheckingOut(tier);
    try {
      const data = await api<{ url: string }>("/funnel/checkout", {
        method: "POST",
        body: { idea, industry, stage, tier, email: email.trim() || null },
      });
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed — try again.");
      setCheckingOut("");
    }
  };

  return (
    <main style={{ position: "relative", zIndex: 2 }}>
      {/* ---------- top bar ---------- */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "26px clamp(24px, 6vw, 72px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span
            className="display"
            style={{ fontSize: 21, color: "var(--parchment)" }}
          >
            TyRey Intelligence
          </span>
          <span className="mono-label" style={{ color: "var(--brass)" }}>
            ™
          </span>
        </div>
        <nav style={{ display: "flex", gap: 26, alignItems: "center" }}>
          <Link href="/login" className="mono-label" style={{ letterSpacing: "0.16em" }}>
            Sign in
          </Link>
          <Link href="/signup" className="btn btn--ghost btn--small">
            Open Workspace
          </Link>
        </nav>
      </header>

      {/* ---------- hero ---------- */}
      <section
        style={{
          padding: "clamp(60px, 10vh, 120px) clamp(24px, 6vw, 72px) 40px",
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        <p className="eyebrow rise rise-1">
          TyRey Technologies · Strategic Advisory Engine
        </p>
        <h1
          className="display rise rise-2"
          style={{
            fontSize: "clamp(42px, 6.5vw, 84px)",
            maxWidth: 900,
            margin: "28px 0 26px",
          }}
        >
          Turn your idea into an{" "}
          <em style={{ color: "var(--brass-bright)", fontStyle: "italic" }}>
            investor-ready business
          </em>{" "}
          in under 10 minutes.
        </h1>
        <p
          className="rise rise-3"
          style={{
            fontSize: 18,
            color: "var(--parchment-dim)",
            maxWidth: 560,
            lineHeight: 1.65,
          }}
        >
          AI-generated business plans, investor memos, and market analysis —
          structured by proprietary decision frameworks and used by founders
          preparing to raise capital or validate ideas.
        </p>
        <div
          className="rise rise-4"
          style={{
            display: "flex",
            gap: 28,
            marginTop: 30,
            flexWrap: "wrap",
          }}
        >
          {["No login required", "Instant results", "Built for fundraising"].map(
            (t) => (
              <span
                key={t}
                className="mono-label"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span style={{ color: "var(--emerald)" }}>◆</span> {t}
              </span>
            )
          )}
        </div>
      </section>

      {/* ---------- idea intake ---------- */}
      <section
        style={{
          padding: "20px clamp(24px, 6vw, 72px) 80px",
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        <div
          className="panel panel--corners rise rise-5"
          style={{ padding: "clamp(28px, 4vw, 48px)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 28,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <span className="mono-label" style={{ color: "var(--brass)" }}>
              Intake Form / 01
            </span>
            <span className="mono-label">Free Intelligence Score™ preview</span>
          </div>

          <div style={{ display: "grid", gap: 22 }}>
            <div className="field">
              <label htmlFor="idea">What is your idea?</label>
              <textarea
                id="idea"
                placeholder="Describe the business you want to build, in plain language…"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 22,
              }}
            >
              <div className="field">
                <label htmlFor="industry">Industry</label>
                <input
                  id="industry"
                  placeholder="e.g. Healthcare, SaaS, Main-street retail"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="stage">Stage</label>
                <select id="stage" value={stage} onChange={(e) => setStage(e.target.value)}>
                  <option value="idea">Idea</option>
                  <option value="building">Building</option>
                  <option value="raising">Raising</option>
                </select>
              </div>
            </div>

            {error && <div className="error-note">{error}</div>}

            <div>
              <button className="btn" onClick={generatePreview} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spin" /> Analyzing your idea…
                  </>
                ) : (
                  "Generate My Business Pack →"
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- preview + paywall ---------- */}
      {preview && (
        <section
          ref={previewRef}
          style={{
            padding: "0 clamp(24px, 6vw, 72px) 90px",
            maxWidth: 1180,
            margin: "0 auto",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: 22 }}>
            Preliminary Assessment / 02
          </p>
          <div className="panel" style={{ padding: "clamp(28px, 4vw, 48px)" }}>
            <Markdown content={preview} />

            {/* locked sections */}
            <div style={{ position: "relative", marginTop: 36 }}>
              <div
                style={{
                  filter: "blur(6px)",
                  userSelect: "none",
                  pointerEvents: "none",
                  opacity: 0.55,
                }}
              >
                <div className="dossier">
                  <h2>Financial Assumptions</h2>
                  <p>
                    Revenue model calibrated to your industry benchmarks with
                    three-year directional projections, cost structure, and
                    break-even analysis…
                  </p>
                  <h2>Go-To-Market</h2>
                  <p>
                    Beachhead segment selection, channel sequencing, and the
                    first 90 days of customer acquisition…
                  </p>
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(180deg, transparent, rgba(11,21,18,0.88) 55%)",
                }}
              >
                <span
                  className="mono-label"
                  style={{ color: "var(--brass-bright)", letterSpacing: "0.3em" }}
                >
                  ◆ Full pack locked ◆
                </span>
              </div>
            </div>
          </div>

          {/* paywall */}
          <div style={{ marginTop: 60 }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>
              Unlock Your Full Pack / 03
            </p>
            <h2 className="display" style={{ fontSize: "clamp(26px, 3.4vw, 40px)", marginBottom: 30 }}>
              Your full investor-ready business pack is ready.
            </h2>

            <div className="field" style={{ maxWidth: 380, marginBottom: 30 }}>
              <label htmlFor="email">Email for delivery (optional)</label>
              <input
                id="email"
                type="email"
                placeholder="founder@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 20,
              }}
            >
              {TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className={`panel${tier.flagship ? " panel--corners" : ""}`}
                  style={{
                    padding: 30,
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                    borderColor: tier.flagship ? "var(--brass)" : undefined,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span className="mono-label" style={{ color: tier.flagship ? "var(--brass-bright)" : undefined }}>
                      {tier.label}
                    </span>
                    {tier.flagship && (
                      <span className="mono-label" style={{ color: "var(--emerald)", fontSize: 10 }}>
                        Most chosen
                      </span>
                    )}
                  </div>
                  <div className="display" style={{ fontSize: 44 }}>
                    {tier.price}
                    <span className="mono-label" style={{ marginLeft: 10 }}>one-time</span>
                  </div>
                  <ul style={{ listStyle: "none", display: "grid", gap: 8, flexGrow: 1 }}>
                    {tier.includes.map((inc) => (
                      <li key={inc} style={{ display: "flex", gap: 10, fontSize: 14.5, color: "var(--parchment-dim)" }}>
                        <span style={{ color: "var(--brass)" }}>—</span> {inc}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`btn${tier.flagship ? "" : " btn--ghost"}`}
                    onClick={() => checkout(tier.id)}
                    disabled={checkingOut !== ""}
                  >
                    {checkingOut === tier.id ? (
                      <>
                        <span className="spin" /> Redirecting…
                      </>
                    ) : (
                      `Unlock ${tier.price}`
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- footer ---------- */}
      <footer
        style={{
          borderTop: "1px solid var(--line)",
          padding: "34px clamp(24px, 6vw, 72px)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <span className="mono-label">© TyRey Technologies, Inc.</span>
        <span className="mono-label" style={{ maxWidth: 520, textAlign: "right" }}>
          Outputs are planning tools — not guarantees of business success or
          financial/legal advice.
        </span>
      </footer>
    </main>
  );
}
