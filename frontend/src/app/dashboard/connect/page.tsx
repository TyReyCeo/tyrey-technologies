"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  ConnectNumber,
  Conversation,
  USAGE_LABELS,
  UsageSummary,
  formatPhone,
  formatWhen,
  isDemo,
} from "@/lib/connect";
import { ConnectHeader } from "./parts";

export default function ConnectOverviewPage() {
  const [numbers, setNumbers] = useState<ConnectNumber[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [provisioning, setProvisioning] = useState(false);

  const load = () => {
    Promise.all([
      api<ConnectNumber[]>("/connect/numbers", { auth: true }),
      api<Conversation[]>("/connect/conversations?limit=5", { auth: true }),
      api<UsageSummary>("/connect/usage/summary", { auth: true }),
    ])
      .then(([nums, convos, use]) => {
        setNumbers(nums);
        setConversations(convos);
        setUsage(use);
        setLoaded(true);
      })
      .catch((e) => {
        setError(e.message);
        setLoaded(true);
      });
  };

  useEffect(load, []);

  const provision = async () => {
    setProvisioning(true);
    setError("");
    try {
      await api("/connect/numbers", { auth: true, method: "POST", body: {} });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not provision a number.");
    }
    setProvisioning(false);
  };

  return (
    <div style={{ maxWidth: 1040 }}>
      <ConnectHeader demo={isDemo(numbers)} />
      {error && <div className="error-note" style={{ marginBottom: 20 }}>{error}</div>}

      {loaded && numbers.length === 0 && (
        <div className="panel panel--corners" style={{ padding: 34, marginBottom: 32 }}>
          <p className="mono-label" style={{ color: "var(--brass)", marginBottom: 12 }}>
            Get started
          </p>
          <p style={{ marginBottom: 18, color: "var(--parchment-dim)" }}>
            Provision a phone number to start texting with customers from the
            unified inbox. Without a carrier connected you&apos;ll get a demo
            number with simulated sends.
          </p>
          <button className="btn" onClick={provision} disabled={provisioning}>
            {provisioning ? (
              <>
                <span className="spin" /> Provisioning…
              </>
            ) : (
              "Provision a Number →"
            )}
          </button>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div className="panel" style={{ padding: "26px 30px" }}>
          <p className="mono-label" style={{ fontSize: 10, marginBottom: 12 }}>
            Your number{numbers.length === 1 ? "" : "s"}
          </p>
          {numbers.length === 0 && (
            <p style={{ color: "var(--parchment-dim)", fontSize: 14 }}>None yet.</p>
          )}
          {numbers.map((n) => (
            <div key={n.id} style={{ marginBottom: 10 }}>
              <p className="display" style={{ fontSize: 22 }}>
                {formatPhone(n.e164)}
              </p>
              <p className="mono-label" style={{ fontSize: 10, marginTop: 4 }}>
                {n.provider}
                {n.toll_free ? " · toll-free" : ""} ·{" "}
                <span
                  style={{
                    color: n.status === "active" ? "var(--emerald)" : "var(--brass)",
                  }}
                >
                  {n.status.replace("_", " ")}
                </span>
              </p>
            </div>
          ))}
        </div>

        <div className="panel" style={{ padding: "26px 30px" }}>
          <p className="mono-label" style={{ fontSize: 10, marginBottom: 12 }}>
            Usage this period
          </p>
          {usage && usage.items.length === 0 && (
            <p style={{ color: "var(--parchment-dim)", fontSize: 14 }}>
              No messages yet this period.
            </p>
          )}
          {usage?.items.map((item) => (
            <div
              key={item.kind}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                marginBottom: 6,
              }}
            >
              <span style={{ color: "var(--parchment-dim)" }}>
                {USAGE_LABELS[item.kind] ?? item.kind}
              </span>
              <span className="mono-label" style={{ fontSize: 12 }}>
                {item.quantity} seg
              </span>
            </div>
          ))}
          {usage && usage.total_cost_cents > 0 && (
            <p className="mono-label" style={{ fontSize: 10, marginTop: 10, color: "var(--brass)" }}>
              Est. carrier cost: ${(usage.total_cost_cents / 100).toFixed(2)}
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16,
        }}
      >
        <h2 className="display" style={{ fontSize: 23 }}>
          Recent conversations
        </h2>
        <Link href="/dashboard/connect/inbox" className="mono-label" style={{ fontSize: 11, color: "var(--brass)" }}>
          Open inbox →
        </Link>
      </div>

      {loaded && conversations.length === 0 && (
        <p style={{ color: "var(--parchment-dim)" }}>
          No conversations yet. Add a contact and send your first message from
          the inbox.
        </p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/connect/inbox?c=${c.id}`}
            className="panel"
            style={{
              padding: "18px 24px",
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 15, marginBottom: 4 }}>{c.contact.name}</p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--parchment-dim)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 480,
                }}
              >
                {c.last_message_preview || "—"}
              </p>
            </div>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <span className="mono-label" style={{ fontSize: 10 }}>
                {c.status}
              </span>
              <span className="mono-label" style={{ fontSize: 10 }}>
                {formatWhen(c.last_message_at)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
