"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AdminClientRow, PLANS, planLabel } from "@/lib/admin";
import { AdminHeader, StatusPill } from "../parts";

export default function AdminClientsPage() {
  const [rows, setRows] = useState<AdminClientRow[]>([]);
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (plan) params.set("plan", plan);
    const qs = params.toString();
    api<AdminClientRow[]>(`/admin/clients${qs ? `?${qs}` : ""}`, { auth: true })
      .then((data) => {
        setRows(data);
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  }, [query, plan]);

  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  return (
    <div style={{ maxWidth: 1080 }}>
      <AdminHeader />
      {error && <div className="error-note" style={{ marginBottom: 20 }}>{error}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
        <input
          placeholder="Search by email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 300, flexGrow: 1 }}
          aria-label="Search clients"
        />
        <select value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Filter by plan">
          <option value="">All plans</option>
          {PLANS.map((p) => (
            <option key={p} value={p}>
              {planLabel(p)}
            </option>
          ))}
        </select>
      </div>

      {loaded && rows.length === 0 && (
        <p style={{ color: "var(--parchment-dim)" }}>No clients match.</p>
      )}

      <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              {["Client", "Plan", "Projects", "Docs", "Orders", "Connect", "Joined", ""].map(
                (h) => (
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
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "12px 16px" }}>
                  {r.email}
                  {r.is_admin && (
                    <span className="mono-label" style={{ fontSize: 9, color: "var(--brass)", marginLeft: 8 }}>
                      ADMIN
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <StatusPill value={r.plan} tone={r.plan === "free" ? undefined : "good"} />
                </td>
                <td style={{ padding: "12px 16px" }}>{r.projects}</td>
                <td style={{ padding: "12px 16px" }}>{r.documents}</td>
                <td style={{ padding: "12px 16px" }}>{r.orders}</td>
                <td style={{ padding: "12px 16px" }}>{r.connect_conversations}</td>
                <td style={{ padding: "12px 16px" }} className="mono-label">
                  <span style={{ fontSize: 10 }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Link
                    href={`/dashboard/admin/clients/${r.id}`}
                    className="mono-label"
                    style={{ fontSize: 10, color: "var(--brass)" }}
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
