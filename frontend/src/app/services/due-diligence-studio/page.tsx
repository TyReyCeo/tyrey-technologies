/** AI Due Diligence Studio — project-based advisory deliverables. */
import type { Metadata } from "next";
import ServicePage from "@/components/ServicePage";

export const metadata: Metadata = {
  title: "AI Due Diligence Studio — TyRey Technologies",
  description:
    "Investment memorandums, business plans, pitch decks, financial models, and market research — delivered in days, not weeks.",
};

export default function DueDiligenceStudio() {
  return (
    <ServicePage
      slug="due-diligence-studio"
      badge="AI Due Diligence Studio"
      title="Investor-grade documents,"
      titleAccent="delivered in days — not weeks."
      subtitle="Professional investment memorandums, business plans, pitch decks, financial models, and market research. You bring the vision; our AI-powered studio does the research and writing."
      image="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1800&q=80"
      imageAlt="Business documents and planning session"
      deliverablesHeading="What we build for you"
      deliverables={[
        { name: "Investment Memorandums", desc: "Professional memos that present your deal the way institutional investors expect to see it." },
        { name: "Business Plans", desc: "Complete, bankable business plans grounded in real market research and financial logic." },
        { name: "Pitch Decks", desc: "Clear, compelling investor narratives — structured slide by slide for the raise you're running." },
        { name: "Financial Models", desc: "Revenue projections, unit economics, and scenario models investors can interrogate." },
        { name: "Market Research", desc: "Sizing, competitive landscape, and trend analysis specific to your industry and geography." },
        { name: "Investor Outreach & Grants", desc: "Outreach packages and grant proposals that get replies — targeted, personalized, and complete." },
      ]}
      audienceHeading="Built for"
      audience={[
        "Founders raising capital",
        "Small business owners",
        "Real estate sponsors",
        "Grant applicants",
        "Buy-side acquirers",
        "Consultants & advisors",
      ]}
      pricing={[
        { name: "Single Deliverable", price: "$2,500", items: ["One core document (memo, plan, or deck)", "One revision round", "Delivered in 3–5 business days"] },
        { name: "Raise-Ready Package", price: "$7,500", featured: true, items: ["Business plan + pitch deck + financial model", "Market research included", "Two revision rounds", "Delivered in 7–10 business days"] },
        { name: "Full Studio Engagement", price: "$15,000", items: ["Everything in Raise-Ready", "Investment memorandum", "Investor outreach package", "Priority turnaround & direct access"] },
      ]}
      pricingNote="Fixed-fee, per-project pricing. Scope is confirmed before any work begins — no hourly billing, no surprises."
      formHeading="Tell us about your project"
    />
  );
}
