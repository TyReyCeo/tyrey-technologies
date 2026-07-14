"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/admin", label: "Overview" },
  { href: "/dashboard/admin/clients", label: "Clients" },
  { href: "/dashboard/admin/subscriptions", label: "Subscriptions" },
  { href: "/dashboard/admin/leads", label: "Leads" },
];

export function AdminHeader() {
  const pathname = usePathname();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 32,
      }}
    >
      <div>
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          Workspace / Admin
        </p>
        <h1 className="display" style={{ fontSize: 36 }}>
          Admin console
        </h1>
      </div>
      <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {TABS.map((tab) => {
          const active =
            tab.href === "/dashboard/admin"
              ? pathname === "/dashboard/admin"
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
  );
}

export function StatusPill({ value, tone }: { value: string; tone?: "good" | "warn" }) {
  return (
    <span
      className="mono-label"
      style={{
        fontSize: 10,
        padding: "3px 8px",
        border: "1px solid var(--line)",
        color:
          tone === "good"
            ? "var(--emerald)"
            : tone === "warn"
              ? "var(--oxblood)"
              : "var(--parchment-dim)",
      }}
    >
      {value.replace("_", " ")}
    </span>
  );
}
