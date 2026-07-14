"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AdminLead, LEAD_STATUSES } from "@/lib/admin";
import { AdminHeader } from "../parts";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    api<AdminLead[]>("/leads", { auth: true })
      .then((data) => {
        setLeads(data);
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const setStatus = async (lead: AdminLead, status: string) => {
    setError("");
    try {
      await api(`/leads/${lead.id}`, { auth: true, method: "PATCH", body: { status } });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  };

  const visible = statusFilter ? leads.filter((l) => l.status === statusFilter) : leads;

  return (
    <div style={{ maxWidth: 1040 }}>
      <AdminHeader />
      {error && <div className="error-note" style={{ marginBottom: 20 }}>{error}</div>}

      <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="mono-label" style={{ fontSize: 10, alignSelf: "center" }}>
          {visible.length} lead{visible.length === 1 ? "" : "s"}
        </span>
      </div>

      {loaded && visible.length === 0 && (
        <p style={{ color: "var(--parchment-dim)" }}>No leads{statusFilter ? ` (${statusFilter})` : ""} yet.</p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {visible.map((l) => (
          <div key={l.id} className="panel" style={{ padding: "18px 24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 15, marginBottom: 4 }}>
                  {l.name}
                  {l.company && (
                    <span style={{ color: "var(--parchment-dim)" }}> — {l.company}</span>
                  )}
                </p>
                <p className="mono-label" style={{ fontSize: 10 }}>
                  {l.service} · {l.email} · {new Date(l.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {l.message && (
                  <button
                    className="btn btn--ghost btn--small"
                    onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                  >
                    {expanded === l.id ? "Hide note" : "View note"}
                  </button>
                )}
                <select
                  value={l.status}
                  onChange={(e) => setStatus(l, e.target.value)}
                  aria-label={`Status for ${l.name}`}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {expanded === l.id && l.message && (
              <p
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid var(--line)",
                  fontSize: 14,
                  color: "var(--parchment-dim)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {l.message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
