"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/connect", label: "Overview" },
  { href: "/dashboard/connect/inbox", label: "Inbox" },
  { href: "/dashboard/connect/contacts", label: "Contacts" },
  { href: "/dashboard/connect/settings", label: "Settings" },
];

export function ConnectHeader({ demo }: { demo: boolean }) {
  const pathname = usePathname();
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            Workspace / Connect AI
          </p>
          <h1 className="display" style={{ fontSize: 36 }}>
            TyRey Connect AI™
          </h1>
        </div>
        <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {TABS.map((tab) => {
            const active =
              tab.href === "/dashboard/connect"
                ? pathname === "/dashboard/connect"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="mono-label"
                style={{
                  padding: "8px 14px",
                  fontSize: 11,
                  border: "1px solid var(--line)",
                  borderBottom: active
                    ? "2px solid var(--brass)"
                    : "1px solid var(--line)",
                  color: active ? "var(--parchment)" : "var(--parchment-dim)",
                  background: active ? "rgba(110,43,54,0.06)" : "transparent",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {demo && (
        <div
          className="mono-label"
          style={{
            fontSize: 11,
            padding: "10px 14px",
            border: "1px solid var(--brass)",
            color: "var(--brass)",
            background: "rgba(110,43,54,0.05)",
          }}
        >
          DEMO MODE — messages are simulated, no carrier is connected. Sends are
          labeled and nothing leaves the platform.
        </div>
      )}
    </div>
  );
}

export function AuthorBadge({ author }: { author: "contact" | "user" | "ai" }) {
  if (author !== "ai") return null;
  return (
    <span
      className="mono-label"
      style={{
        fontSize: 9,
        color: "var(--brass)",
        border: "1px solid rgba(110,43,54,0.35)",
        padding: "1px 6px",
        marginLeft: 8,
      }}
    >
      AI
    </span>
  );
}
