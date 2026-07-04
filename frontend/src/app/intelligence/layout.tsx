import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TyRey Intelligence™ — Investor-Ready Business Packs in Minutes",
  description:
    "AI-generated business plans, investor memos, and market analysis used by founders preparing to raise capital. By TyRey Technologies, Inc.",
};

export default function IntelligenceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
