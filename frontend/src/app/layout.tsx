import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tyreytechnologies.com"),
  title: "TyRey Technologies, Inc. — Intelligence Infrastructure for Modern Business",
  description:
    "AI-powered strategy, deal flow, and executive support. Home of TyRey Intelligence™, the AI Due Diligence Studio, Acquisition Scout, and CEO in a Box.",
  openGraph: {
    type: "website",
    siteName: "TyRey Technologies",
    url: "https://tyreytechnologies.com",
    title: "TyRey Technologies, Inc.",
    description:
      "Building the Intelligence Infrastructure for Modern Business — AI-powered strategy, deal flow, and executive support.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TyRey Technologies, Inc.",
    description:
      "Building the Intelligence Infrastructure for Modern Business — AI-powered strategy, deal flow, and executive support.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${instrumentSans.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
