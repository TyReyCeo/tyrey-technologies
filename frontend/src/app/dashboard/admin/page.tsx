"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AdminOverview, dollars, planLabel } from "@/lib/admin";
import { AdminHeader } from "./parts";

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<AdminOverview>("/admin/overview", { auth: true })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const stat = (label: string, value: string, href?: string) => {
    const inner = (
      <div className="panel" style={{ padding: "22px 26px" }}>
        <p className="mono-label" style={{ fontSize: 10, marginBottom: 8 }}>
          {label}
        </p>
        <p className="display" style={{ fontSize: 30 }}>
          {value}
        </p>
      </div>
    );
    return href ? (
      <Link key={label} href={href}>
        {inner}
      </Link>
    ) : (
      <div key={label}>{inner}</div>
    );
  };

  return (
    <div style={{ maxWidth: 1040 }}>
      <AdminHeader />
      {error && <div className="error-note" style={{ marginBottom: 20 }}>{error}</div>}
      {!data && !error && <p style={{ color: "var(--parchment-dim)" }}>Loading…</p>}

      {data && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginBottom: 28,
            }}
          >
            {stat("Clients", String(data.users_total), "/dashboard/admin/clients")}
            {stat("Est. MRR", dollars(data.mrr_cents), "/dashboard/admin/subscriptions")}
            {stat("One-time revenue", dollars(data.orders_revenue_cents))}
            {stat(
              "Connect messages · period",
              String(data.connect_messages_this_period)
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
              marginBottom: 28,
            }}
          >
            <div className="panel" style={{ padding: "22px 26px" }}>
              <p className="mono-label" style={{ fontSize: 10, marginBottom: 12 }}>
                Clients by plan
              </p>
              {data.users_by_plan.map((m) => (
                <div
                  key={m.label}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}
                >
                  <span style={{ color: "var(--parchment-dim)" }}>{planLabel(m.label)}</span>
                  <span className="mono-label" style={{ fontSize: 12 }}>{m.value}</span>
                </div>
              ))}
            </div>

            <div className="panel" style={{ padding: "22px 26px" }}>
              <p className="mono-label" style={{ fontSize: 10, marginBottom: 12 }}>
                Lead pipeline
              </p>
              {data.leads_by_status.length === 0 && (
                <p style={{ fontSize: 14, color: "var(--parchment-dim)" }}>No leads yet.</p>
              )}
              {data.leads_by_status.map((m) => (
                <div
                  key={m.label}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}
                >
                  <span style={{ color: "var(--parchment-dim)" }}>{m.label}</span>
                  <span className="mono-label" style={{ fontSize: 12 }}>{m.value}</span>
                </div>
              ))}
              <Link
                href="/dashboard/admin/leads"
                className="mono-label"
                style={{ fontSize: 10, color: "var(--brass)" }}
              >
                Manage leads →
              </Link>
            </div>

            <div className="panel" style={{ padding: "22px 26px" }}>
              <p className="mono-label" style={{ fontSize: 10, marginBottom: 12 }}>
                Connect AI numbers
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                <span style={{ color: "var(--parchment-dim)" }}>Active</span>
                <span className="mono-label" style={{ fontSize: 12, color: "var(--emerald)" }}>
                  {data.connect_active_numbers}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                <span style={{ color: "var(--parchment-dim)" }}>Pending registration</span>
                <span className="mono-label" style={{ fontSize: 12, color: "var(--oxblood)" }}>
                  {data.connect_pending_registration}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--parchment-dim)", marginTop: 8 }}>
                Pending numbers can&apos;t send real SMS until 10DLC/toll-free
                registration clears (see the registration runbook).
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
