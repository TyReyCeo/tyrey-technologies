/** CEO in a Box — subscription outsourced executive office. */
import type { Metadata } from "next";
import ServicePage from "@/components/ServicePage";

export const metadata: Metadata = {
  title: "CEO in a Box — TyRey Technologies",
  description:
    "Your outsourced executive office for a flat monthly rate — proposals, SOPs, marketing, contract drafts, investor materials, and strategic planning.",
};

const STEPS = [
  { n: "1", name: "Subscribe", desc: "Pick a plan and get your request queue the same day." },
  { n: "2", name: "Request", desc: "Add anything to your queue — a proposal, an SOP, a marketing push." },
  { n: "3", name: "Receive", desc: "Executive-grade deliverables back in 24–48 hours, revised until right." },
];

export default function CeoInABox() {
  return (
    <ServicePage
      slug="ceo-in-a-box"
      badge="CEO in a Box"
      title="Your outsourced executive office,"
      titleAccent="for a flat monthly rate."
      subtitle="Unlimited help with proposals, employee manuals, marketing, customer emails, SOPs, contract drafts, investor materials, and strategic planning — everything a chief of staff, ops lead, and strategy consultant would do, on subscription."
      deliverablesHeading="Unlimited requests across"
      deliverables={[
        { name: "Proposals & Bids", desc: "Client proposals, RFP responses, and quotes that win work — turned around fast." },
        { name: "Employee Manuals & SOPs", desc: "Handbooks, onboarding docs, and standard operating procedures that scale your team." },
        { name: "Marketing & Customer Emails", desc: "Campaigns, newsletters, landing copy, and customer communications in your voice." },
        { name: "Contract Drafts", desc: "First-draft agreements and templates ready for your attorney's review." },
        { name: "Investor Materials", desc: "Updates, one-pagers, and data-room documents that keep investors confident." },
        { name: "Strategic Planning", desc: "Quarterly plans, market analysis, and decision memos when you need a thinking partner." },
      ]}
      audienceHeading="Made for"
      audience={[
        "Owner-operators",
        "Agencies & firms",
        "Trades & services businesses",
        "E-commerce brands",
        "Franchisees",
        "Early-stage startups",
      ]}
      pricing={[
        { name: "Executive", price: "$995", period: "/mo", featured: true, items: ["Unlimited requests, one at a time", "48-hour typical turnaround", "All document types included", "Cancel anytime — no contracts"] },
        { name: "Executive Plus", price: "$1,795", period: "/mo", items: ["Two requests in progress at once", "24-hour priority turnaround", "Monthly strategy call", "Quarterly planning session included"] },
        { name: "Team", price: "Custom", items: ["Multiple seats for your leadership team", "Dedicated account manager", "Custom templates & brand voice", "Volume pricing"] },
      ]}
      pricingNote="Ten businesses on Executive is real recurring revenue for us — and a full executive office for a fraction of one hire for you. Contract drafts are working documents, not legal advice."
      formHeading="Start your membership"
    >
      {/* How it works */}
      <section
        style={{
          padding: "0 clamp(24px, 6vw, 72px) 70px",
          maxWidth: 1180,
          margin: "0 auto",
        }}
      >
        <p className="eyebrow" style={{ marginBottom: 26 }}>
          How it works
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {STEPS.map((s) => (
            <div key={s.n} className="panel" style={{ padding: 26 }}>
              <span className="display" style={{ fontSize: 30, color: "var(--brass-bright)" }}>
                {s.n}
              </span>
              <h3 className="display" style={{ fontSize: 19, margin: "10px 0 8px" }}>
                {s.name}
              </h3>
              <p style={{ fontSize: 14.5, color: "var(--parchment-dim)", lineHeight: 1.65 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </ServicePage>
  );
}
