import type { Metadata } from "next";
import { Archivo, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
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
        className={`${fraunces.variable} ${archivo.variable} ${plexMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
