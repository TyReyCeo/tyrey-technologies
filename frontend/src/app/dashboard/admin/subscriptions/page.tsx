"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AdminClientRow, AdminOrder, dollars, planLabel } from "@/lib/admin";
import { AdminHeader, StatusPill } from "../parts";

const PLAN_MRR_CENTS: Record<string, number> = {
  starter: 4900,
  pro: 14900,
  executive: 49900,
  connect: 49500,
  connect_executive: 99500,
};

export default function AdminSubscriptionsPage() {
  const [clients, setClients] = useState<AdminClientRow[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<AdminClientRow[]>("/admin/clients", { auth: true }),
      api<AdminOrder[]>("/admin/orders", { auth: true }),
    ])
      .then(([c, o]) => {
        setClients(c);
        setOrders(o);
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  }, []);

  const subscribers = clients.filter((c) => c.plan !== "free");
  const mrr = subscribers.reduce((sum, c) => sum + (PLAN_MRR_CENTS[c.plan] ?? 0), 0);

  return (
    <div style={{ maxWidth: 1040 }}>
      <AdminHeader />
      {error && <div className="error-note" style={{ marginBottom: 20 }}>{error}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <div className="panel" style={{ padding: "22px 26px" }}>
          <p className="mono-label" style={{ fontSize: 10, marginBottom: 8 }}>
            Active subscribers
          </p>
          <p className="display" style={{ fontSize: 30 }}>
            {subscribers.length}
          </p>
        </div>
        <div className="panel" style={{ padding: "22px 26px" }}>
          <p className="mono-label" style={{ fontSize: 10, marginBottom: 8 }}>
            Est. MRR
          </p>
          <p className="display" style={{ fontSize: 30 }}>
            {dollars(mrr)}
          </p>
        </div>
        <div className="panel" style={{ padding: "22px 26px" }}>
          <p className="mono-label" style={{ fontSize: 10, marginBottom: 8 }}>
            One-time orders
          </p>
          <p className="display" style={{ fontSize: 30 }}>
            {orders.length}
          </p>
        </div>
      </div>

      <h2 className="display" style={{ fontSize: 22, marginBottom: 14 }}>
        Subscriptions
      </h2>
      {loaded && subscribers.length === 0 && (
        <p style={{ color: "var(--parchment-dim)", marginBottom: 28 }}>
          No paid subscriptions yet.
        </p>
      )}
      <div style={{ display: "grid", gap: 12, marginBottom: 36 }}>
        {subscribers.map((c) => (
          <div
            key={c.id}
            className="panel"
            style={{
              padding: "18px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ fontSize: 15, marginBottom: 4 }}>{c.email}</p>
              <p className="mono-label" style={{ fontSize: 10 }}>
                {PLAN_MRR_CENTS[c.plan] ? `${dollars(PLAN_MRR_CENTS[c.plan])}/mo` : "custom"} ·{" "}
                {c.has_billing_account ? "billed via Stripe" : "no billing account (comped/manual)"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <StatusPill value={planLabel(c.plan)} tone="good" />
              <Link
                href={`/dashboard/admin/clients/${c.id}`}
                className="mono-label"
                style={{ fontSize: 10, color: "var(--brass)" }}
              >
                Manage →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <h2 className="display" style={{ fontSize: 22, marginBottom: 14 }}>
        One-time funnel orders
      </h2>
      {loaded && orders.length === 0 && (
        <p style={{ color: "var(--parchment-dim)" }}>No orders yet.</p>
      )}
      <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
        {orders.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {["Email", "Tier", "Amount", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    className="mono-label"
                    style={{
                      fontSize: 10,
                      textAlign: "left",
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 16px" }}>{o.email ?? "—"}</td>
                  <td style={{ padding: "12px 16px" }}>{o.tier}</td>
                  <td style={{ padding: "12px 16px" }}>{dollars(o.amount)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusPill
                      value={o.status}
                      tone={o.status === "generated" || o.status === "paid" ? "good" : o.status === "failed" ? "warn" : undefined}
                    />
                  </td>
                  <td style={{ padding: "12px 16px" }} className="mono-label">
                    <span style={{ fontSize: 10 }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
