/** Acquisition Scout — weekly AI-sourced acquisition targets for buyers of businesses. */
import type { Metadata } from "next";
import ServicePage from "@/components/ServicePage";

export const metadata: Metadata = {
  title: "Acquisition Scout — TyRey Technologies",
  description:
    "Qualified acquisition targets delivered every week — companies for sale, retiring owners, distressed assets, and overlooked opportunities.",
};

export default function AcquisitionScout() {
  return (
    <ServicePage
      slug="acquisition-scout"
      badge="Acquisition Scout"
      title="Qualified acquisition targets,"
      titleAccent="delivered every week."
      subtitle="An AI workflow that continuously scans for companies for sale, owners nearing retirement, distressed assets, overlooked industrial properties, and AI infrastructure opportunities — then qualifies them before they reach your inbox."
      deliverablesHeading="What the Scout finds"
      deliverables={[
        { name: "Companies for Sale", desc: "Listed and off-market businesses matched to your mandate, size range, and geography." },
        { name: "Retiring Owners", desc: "Succession-driven opportunities — owners approaching exit before they ever hit a marketplace." },
        { name: "Distressed Assets", desc: "Businesses and assets under pressure where speed and certainty win the deal." },
        { name: "Industrial Properties", desc: "Overlooked industrial and logistics real estate with repositioning upside." },
        { name: "AI Infrastructure", desc: "Data centers, power, connectivity, and adjacent assets riding the AI buildout." },
        { name: "Qualified Briefs", desc: "Every target arrives as a structured brief: what it is, why it fits, and how to approach." },
      ]}
      audienceHeading="Who buys our deal flow"
      audience={[
        "Private equity firms",
        "Family offices",
        "Investment banks",
        "Search funds",
        "Independent sponsors",
        "Strategic acquirers",
      ]}
      pricing={[
        { name: "Scout Report", price: "$1,500", period: "/mo", items: ["Weekly qualified target list", "One mandate (industry + geography)", "Structured briefs on every target", "Cancel anytime"] },
        { name: "Scout Pro", price: "$3,500", period: "/mo", featured: true, items: ["Everything in Scout Report", "Up to three mandates", "Owner/contact sourcing on request", "Priority screening calls"] },
        { name: "Success-Fee Mandate", price: "Custom", items: ["Dedicated sourcing for a specific mandate", "Reduced retainer + success fee on close", "Warm introductions, not just leads", "NDA-backed exclusivity available"] },
      ]}
      pricingNote="One successful introduction can be worth many multiples of a year's subscription. Success-fee structures are negotiated per mandate."
      formHeading="Describe your acquisition mandate"
    />
  );
}
