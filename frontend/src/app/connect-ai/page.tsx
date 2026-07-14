/**
 * TyRey Connect AI™ — the intelligent communications platform.
 * Flagship platform page: channels, AI layer, built-in business system,
 * developer platform, early-access pricing.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm, SiteFooter, SiteNav } from "@/components/Site";

export const metadata: Metadata = {
  title: "TyRey Connect AI™ — The Intelligent Communications Platform",
  description:
    "SMS, voice, email, WhatsApp, and video — with AI receptionists, sales agents, CRM, and marketing automation built in. One platform, minimal setup.",
};

const PROOF: [string, string][] = [
  ["6 channels", "SMS · MMS · Voice · Email · WhatsApp · Video"],
  ["24/7", "AI receptionist, sales & support agents"],
  ["1 platform", "Communications + CRM + automation"],
];

const CHANNELS = [
  {
    numeral: "01",
    name: "SMS & MMS",
    desc: "Two-way texting, bulk campaigns, toll-free and short-code messaging, templates, scheduling — with AI drafting and answering replies.",
  },
  {
    numeral: "02",
    name: "Voice",
    desc: "Business phone numbers, IVR, call recording, live transcription, voicemail, and an AI receptionist that answers every call.",
  },
  {
    numeral: "03",
    name: "Email",
    desc: "Marketing campaigns, transactional email, AI-generated newsletters, templates, and open-rate tracking.",
  },
  {
    numeral: "04",
    name: "WhatsApp",
    desc: "Business messaging, AI-powered conversations, customer support, and broadcast campaigns on the channel your customers already use.",
  },
  {
    numeral: "05",
    name: "Video",
    desc: "Meetings with screen sharing, recording, live captions, and AI summaries delivered to your inbox when the call ends.",
  },
  {
    numeral: "06",
    name: "Unified Inbox",
    desc: "Every conversation from every channel in one queue — assigned, prioritized, and summarized by AI for your team.",
  },
];

const AI_ACTIONS = [
  "Answers customer questions instantly",
  "Schedules appointments on your calendar",
  "Qualifies leads before you ever reply",
  "Summarizes every conversation",
  "Detects sentiment and urgency",
  "Drafts follow-ups and sales replies",
  "Translates languages in real time",
  "Escalates to a human when it matters",
];

const AI_STAFF = [
  "AI Receptionist",
  "AI Sales Agent",
  "AI Support Agent",
  "AI Marketing Copilot",
];

const SYSTEM = [
  {
    name: "Built-in CRM",
    desc: "Customer profiles, pipeline management, deals, tasks, notes, and AI-recommended next actions — no separate CRM subscription.",
  },
  {
    name: "Marketing",
    desc: "SMS and email campaigns, drip sequences, audience segmentation, A/B testing, QR codes, and AI copywriting.",
  },
  {
    name: "Automation",
    desc: "Visual workflow builder: triggers, waits, branches, and AI decision steps that run your follow-up while you work.",
  },
  {
    name: "Analytics",
    desc: "Revenue, messages, calls, conversion rates, campaign ROI, AI performance, and team productivity in one dashboard.",
  },
];

const WORKFLOW_STEPS = [
  "New lead arrives",
  "Send SMS welcome",
  "Wait 1 hour",
  "Send email",
  "AI evaluates the response",
  "Appointment scheduled",
  "Sales rep notified",
];

const API_SURFACES = [
  "Messaging",
  "Voice",
  "Email",
  "Contacts",
  "Webhooks",
  "AI",
];

const PRICING = [
  {
    name: "Connect",
    price: "$495",
    period: "/mo",
    items: [
      "One business number, unified inbox",
      "SMS, MMS & email channels",
      "AI receptionist & auto-replies",
      "Built-in CRM · 3 team seats",
    ],
  },
  {
    name: "Connect Executive",
    price: "$995",
    period: "/mo",
    featured: true,
    items: [
      "Everything in Connect",
      "Voice with recording & transcription",
      "AI sales & support agents",
      "Marketing automation & workflows",
      "WhatsApp channel · 10 team seats",
    ],
  },
  {
    name: "Enterprise & White Label",
    price: "Custom",
    items: [
      "Video meetings with AI summaries",
      "Developer APIs & SDK access",
      "Custom AI trained on your knowledge base",
      "White-label & reseller terms",
      "Dedicated account manager",
    ],
  },
];

export default function ConnectAI() {
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
              TyRey Connect AI™ — Early access
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
              The intelligent communications platform{" "}
              <em style={{ color: "var(--oxblood)" }}>
                for modern business.
              </em>
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
              Every call, text, email, and WhatsApp message — answered,
              qualified, and followed up by AI, inside one platform with CRM
              and marketing automation built in. No developers required.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <a href="#contact" className="btn">
                Request early access
              </a>
              <a href="#pricing" className="btn btn--ghost">
                See pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- photo band ---------- */}
      <div
        style={{
          borderBottom: "1px solid var(--rule)",
          height: 360,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80"
          alt="Team collaborating around communications dashboards"
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

      {/* ---------- channels ledger ---------- */}
      <section
        style={{
          padding: "80px var(--section-pad)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div className="ledger-grid">
          <div>
            <p className="eyebrow" style={{ margin: "0 0 16px" }}>
              Channels
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
              Every conversation, one place
            </h2>
            <p
              style={{
                margin: "20px 0 0",
                fontSize: 15,
                lineHeight: 1.7,
                color: "var(--ink-soft)",
              }}
            >
              Twilio sells APIs to developers. TyRey Connect AI gives your
              business the finished product — every channel live from day one,
              managed from a single inbox.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {CHANNELS.map((c) => (
              <div key={c.numeral} className="ledger-row">
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 28,
                    color: "var(--numeral)",
                  }}
                >
                  {c.numeral}
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
                    {c.name}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: "var(--ink-soft)",
                    }}
                  >
                    {c.desc}
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
                  AI-powered
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- AI layer (inverted band) ---------- */}
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
              The AI layer
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
              Every message is processed by AI
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
              Other platforms route messages. Connect AI understands them.
              Powered by the same TyRey Intelligence engine behind our
              advisory work, it acts on every conversation:
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "10px 28px",
                marginBottom: 34,
              }}
            >
              {AI_ACTIONS.map((a) => (
                <p
                  key={a}
                  style={{
                    margin: 0,
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: "var(--dim-on-ink)",
                    borderBottom: "1px solid rgba(250,247,241,0.14)",
                    paddingBottom: 10,
                  }}
                >
                  {a}
                </p>
              ))}
            </div>
            <a href="#contact" className="btn btn--paper">
              Put AI on your front line
            </a>
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
              Your AI staff
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {AI_STAFF.map((item, i) => (
                <span
                  key={item}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 21,
                    borderBottom:
                      i < AI_STAFF.length - 1
                        ? "1px solid rgba(250,247,241,0.14)"
                        : "none",
                    paddingBottom: i < AI_STAFF.length - 1 ? 14 : 0,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
            <p
              style={{
                margin: "26px 0 0",
                fontSize: 13.5,
                lineHeight: 1.65,
                color: "var(--dim-on-ink)",
              }}
            >
              Trained on your business, working around the clock, escalating
              to your team only when a human touch wins the deal.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- built-in business system ---------- */}
      <section
        style={{
          padding: "70px var(--section-pad)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <p className="eyebrow" style={{ marginBottom: 26 }}>
          A complete business system — not just messaging
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {SYSTEM.map((s) => (
            <div key={s.name} className="panel" style={{ padding: 26 }}>
              <h3 className="display" style={{ fontSize: 22, marginBottom: 8 }}>
                {s.name}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--ink-soft)",
                  lineHeight: 1.65,
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- automation example + developer platform ---------- */}
      <section
        style={{
          padding: "70px var(--section-pad)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div className="panel" style={{ padding: 30 }}>
            <p className="eyebrow" style={{ marginBottom: 22 }}>
              Automation you can see
            </p>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "var(--font-display)",
                      fontSize: 19,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--numeral)",
                        marginRight: 14,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </p>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <p
                      style={{
                        margin: "4px 0",
                        color: "var(--oxblood)",
                        fontSize: 14,
                        paddingLeft: 10,
                      }}
                    >
                      ↓
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p
              style={{
                margin: "22px 0 0",
                fontSize: 14,
                color: "var(--ink-soft)",
                lineHeight: 1.65,
              }}
            >
              Build it once in the visual workflow builder — Connect AI runs
              it on every new lead, forever.
            </p>
          </div>
          <div className="panel" style={{ padding: 30 }}>
            <p className="eyebrow" style={{ marginBottom: 22 }}>
              For your developers — when you want them
            </p>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 15,
                lineHeight: 1.7,
                color: "var(--ink-soft)",
              }}
            >
              Everything in Connect AI works without writing a line of code.
              But every capability is also exposed as an API with SDKs and
              webhooks, so your systems can plug straight in.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {API_SURFACES.map((a) => (
                <span
                  key={a}
                  style={{
                    border: "1px solid var(--rule)",
                    padding: "8px 16px",
                    fontSize: 13,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {a} API
                </span>
              ))}
            </div>
            <p
              style={{
                margin: "20px 0 0",
                fontSize: 14,
                color: "var(--ink-soft)",
                lineHeight: 1.65,
              }}
            >
              SDKs planned for JavaScript, Python, Java, C#, PHP, and Go —
              available on Enterprise during early access.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- audience ---------- */}
      <section
        style={{
          padding: "70px var(--section-pad)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <p className="eyebrow" style={{ marginBottom: 22 }}>
          Built for
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {[
            "Service businesses & trades",
            "Clinics & professional practices",
            "Real estate & brokerages",
            "E-commerce brands",
            "Agencies & resellers",
            "Franchises & multi-location teams",
          ].map((a) => (
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
          Early-access pricing
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {PRICING.map((p, i) => (
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
                Request early access
              </a>
            </div>
          ))}
        </div>
        <p
          style={{
            marginTop: 22,
            fontSize: 14,
            color: "var(--ink-soft)",
            maxWidth: 640,
            lineHeight: 1.65,
          }}
        >
          Messaging and voice usage is billed at transparent per-use rates on
          top of your plan. Early-access members lock their plan rate before
          general availability.
        </p>
      </section>

      {/* ---------- lead form ---------- */}
      <section
        style={{
          padding: "70px var(--section-pad) 90px",
          maxWidth: 860,
          margin: "0 auto",
        }}
      >
        <LeadForm
          service="connect-ai"
          heading="Request early access"
          buttonLabel="Request Early Access →"
        />
        <p className="mono-label" style={{ textAlign: "center", marginTop: 22 }}>
          Not sure yet?{" "}
          <Link href="/intelligence" style={{ color: "var(--oxblood)" }}>
            Try TyRey Intelligence™ free
          </Link>{" "}
          and see the engine behind the platform.
        </p>
      </section>

      <SiteFooter />
    </main>
  );
}
