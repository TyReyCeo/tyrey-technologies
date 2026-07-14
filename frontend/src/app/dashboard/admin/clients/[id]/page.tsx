"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { AdminClientDetail, PLANS, dollars, planLabel } from "@/lib/admin";
import { AdminHeader, StatusPill } from "../../parts";

export default function AdminClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminClientDetail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api<AdminClientDetail>(`/admin/clients/${id}`, { auth: true })
      .then(setDetail)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(load, [load]);

  const changePlan = async (plan: string) => {
    if (!detail || plan === detail.plan) return;
    if (!window.confirm(`Change ${detail.email} from ${planLabel(detail.plan)} to ${planLabel(plan)}?`)) {
      load();
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`/admin/clients/${id}`, { auth: true, method: "PATCH", body: { plan } });
      setNotice(`Plan changed to ${planLabel(plan)}.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Plan change failed.");
    }
    setSaving(false);
  };

  const cancelSubscription = async () => {
    if (!detail) return;
    if (
      !window.confirm(
        `Cancel ${detail.email}'s Stripe subscription(s) at period end? Their plan downgrades automatically when the subscription ends.`
      )
    ) {
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await api<{ cancelled: number; detail: string }>(
        `/admin/clients/${id}/cancel-subscription`,
        { auth: true, method: "POST" }
      );
      setNotice(res.detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancellation failed.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 1040 }}>
      <AdminHeader />
      <Link
        href="/dashboard/admin/clients"
        className="mono-label"
        style={{ fontSize: 10, color: "var(--brass)", display: "inline-block", marginBottom: 18 }}
      >
        ← All clients
      </Link>
      {error && <div className="error-note" style={{ marginBottom: 20 }}>{error}</div>}
      {notice && (
        <p className="mono-label" style={{ color: "var(--emerald)", marginBottom: 20 }}>
          {notice}
        </p>
      )}
      {!detail && !error && <p style={{ color: "var(--parchment-dim)" }}>Loading…</p>}

      {detail && (
        <>
          <div className="panel panel--corners" style={{ padding: 30, marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 className="display" style={{ fontSize: 26, marginBottom: 6 }}>
                  {detail.email}
                  {detail.is_admin && (
                    <span className="mono-label" style={{ fontSize: 10, color: "var(--brass)", marginLeft: 10 }}>
                      ADMIN
                    </span>
                  )}
                </h2>
                <p className="mono-label" style={{ fontSize: 10 }}>
                  Joined {new Date(detail.created_at).toLocaleDateString()} ·{" "}
                  {detail.stripe_customer_id
                    ? `Stripe ${detail.stripe_customer_id}`
                    : "No billing account"}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <label className="mono-label" htmlFor="plan-select" style={{ fontSize: 10 }}>
                  Plan
                </label>
                <select
                  id="plan-select"
                  value={detail.plan}
                  onChange={(e) => changePlan(e.target.value)}
                  disabled={saving}
                >
                  {PLANS.map((p) => (
                    <option key={p} value={p}>
                      {planLabel(p)}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn--ghost btn--small"
                  onClick={cancelSubscription}
                  disabled={saving || !detail.stripe_customer_id}
                  title={
                    detail.stripe_customer_id
                      ? "Cancel Stripe subscription at period end"
                      : "No billing account"
                  }
                >
                  Cancel subscription
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
              marginBottom: 24,
            }}
          >
            {[
              ["Projects", String(detail.projects.length)],
              ["Documents", String(detail.documents)],
              ["Connect threads", String(detail.connect_conversations)],
              ["Connect usage · period", dollars(detail.connect_usage_cents_this_period)],
            ].map(([label, value]) => (
              <div key={label} className="panel" style={{ padding: "18px 22px" }}>
                <p className="mono-label" style={{ fontSize: 10, marginBottom: 6 }}>
                  {label}
                </p>
                <p className="display" style={{ fontSize: 24 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {detail.connect_numbers.length > 0 && (
            <div className="panel" style={{ padding: "22px 26px", marginBottom: 24 }}>
              <p className="mono-label" style={{ fontSize: 10, marginBottom: 12 }}>
                Connect numbers
              </p>
              {detail.connect_numbers.map((n) => (
                <div
                  key={n.id}
                  style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 8 }}
                >
                  <span style={{ fontSize: 15 }}>{n.e164}</span>
                  <span className="mono-label" style={{ fontSize: 10 }}>
                    {n.provider}
                    {n.toll_free ? " · toll-free" : ""}
                  </span>
                  <StatusPill value={n.status} tone={n.status === "active" ? "good" : "warn"} />
                </div>
              ))}
            </div>
          )}

          {detail.orders.length > 0 && (
            <div className="panel" style={{ padding: "22px 26px", marginBottom: 24 }}>
              <p className="mono-label" style={{ fontSize: 10, marginBottom: 12 }}>
                Funnel orders
              </p>
              {detail.orders.map((o) => (
                <div
                  key={o.id}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6, gap: 12, flexWrap: "wrap" }}
                >
                  <span>
                    {o.tier} · {dollars(o.amount)}
                  </span>
                  <span className="mono-label" style={{ fontSize: 10 }}>
                    {o.status} · {new Date(o.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {detail.projects.length > 0 && (
            <div className="panel" style={{ padding: "22px 26px", marginBottom: 24 }}>
              <p className="mono-label" style={{ fontSize: 10, marginBottom: 12 }}>
                Projects
              </p>
              {detail.projects.map((p) => (
                <div
                  key={p.id}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6, gap: 12, flexWrap: "wrap" }}
                >
                  <span>{p.name}</span>
                  <span className="mono-label" style={{ fontSize: 10 }}>
                    {p.industry} · {p.stage}
                  </span>
                </div>
              ))}
            </div>
          )}

          {detail.leads.length > 0 && (
            <div className="panel" style={{ padding: "22px 26px", marginBottom: 24 }}>
              <p className="mono-label" style={{ fontSize: 10, marginBottom: 12 }}>
                Lead history (same email)
              </p>
              {detail.leads.map((l) => (
                <div
                  key={l.id}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6, gap: 12, flexWrap: "wrap" }}
                >
                  <span>
                    {l.service} — {l.name}
                  </span>
                  <StatusPill value={l.status} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
