"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, getToken, logout } from "@/lib/api";

const NAV = [
  { href: "/dashboard", label: "Projects", code: "01" },
  { href: "/dashboard/vault", label: "Vault", code: "02" },
  { href: "/dashboard/billing", label: "Billing", code: "03" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api<{ email: string; plan: string }>("/auth/me", { auth: true })
      .then((me) => {
        setEmail(me.email);
        setPlan(me.plan);
        setReady(true);
      })
      .catch(() => {
        logout();
        router.replace("/login");
      });
  }, [router]);

  if (!ready) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          className="spin"
          style={{
            width: 26,
            height: 26,
            borderColor: "rgba(110,43,54,0.25)",
            borderTopColor: "var(--oxblood)",
          }}
        />
      </main>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        position: "relative",
        zIndex: 2,
      }}
    >
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: "1px solid var(--line)",
          padding: "30px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 40,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <Link href="/" className="display" style={{ fontSize: 19 }}>
          TyRey<span style={{ color: "var(--brass)" }}>™</span>
        </Link>

        <nav style={{ display: "grid", gap: 4 }}>
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard" || pathname.startsWith("/dashboard/projects") || pathname.startsWith("/dashboard/documents")
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "baseline",
                  padding: "11px 14px",
                  borderLeft: `2px solid ${active ? "var(--brass)" : "transparent"}`,
                  background: active ? "rgba(110,43,54,0.06)" : "transparent",
                  transition: "background 0.2s ease",
                }}
              >
                <span className="mono-label" style={{ fontSize: 10, color: "var(--brass)" }}>
                  {item.code}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    color: active ? "var(--parchment)" : "var(--parchment-dim)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", display: "grid", gap: 14 }}>
          <div>
            <p className="mono-label" style={{ fontSize: 10, marginBottom: 4 }}>
              Signed in
            </p>
            <p style={{ fontSize: 13, color: "var(--parchment-dim)", wordBreak: "break-all" }}>
              {email}
            </p>
            <p className="mono-label" style={{ fontSize: 10, color: "var(--emerald)", marginTop: 4 }}>
              Plan: {plan}
            </p>
          </div>
          <button
            className="btn btn--ghost btn--small"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flexGrow: 1, padding: "42px clamp(24px, 4vw, 56px)", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
