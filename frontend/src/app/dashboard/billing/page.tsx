"use client";

import { useState } from "react";
import { api } from "@/lib/api";

const PLANS = [
  {
    id: "starter",
    price: "$49",
    label: "Starter",
    includes: ["Limited projects", "Business plans + market analysis", "PDF export"],
  },
  {
    id: "pro",
    price: "$149",
    label: "Pro",
    flagship: true,
    includes: [
      "Unlimited projects",
      "All 11 intelligence modules",
      "Business Genome™ + Intelligence Score™",
      "Edit-with-AI",
    ],
  },
  {
    id: "executive",
    price: "$499",
    label: "Executive",
    includes: [
      "Everything in Pro",
      "Priority AI processing",
      "Acquisition + capital modules",
      "Advanced reporting",
    ],
  },
];

export default function BillingPage() {
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");

  const subscribe = async (plan: string) => {
    setWorking(plan);
    setError("");
    try {
      const data = await api<{ checkout_url: string }>("/billing/subscribe", {
        auth: true,
        method: "POST",
        body: { plan },
      });
      window.location.href = data.checkout_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout.");
      setWorking("");
    }
  };

  const openPortal = async () => {
    setWorking("portal");
    setError("");
    try {
      const data = await api<{ portal_url: string }>("/billing/portal", {
        auth: true,
        method: "POST",
      });
      window.location.href = data.portal_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open billing portal.");
      setWorking("");
    }
  };

  return (
    <div style={{ maxWidth: 1040 }}>
      <p className="eyebrow" style={{ marginBottom: 12 }}>
        Workspace / Billing
      </p>
      <h1 className="display" style={{ fontSize: 36, marginBottom: 8 }}>
        Subscription
      </h1>
      <p style={{ color: "var(--parchment-dim)", marginBottom: 38 }}>
        Upgrade for unlimited projects and the full framework library.
      </p>

      {error && <div className="error-note" style={{ marginBottom: 24 }}>{error}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginBottom: 40,
        }}
      >
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`panel${plan.flagship ? " panel--corners" : ""}`}
            style={{
              padding: 30,
              display: "flex",
              flexDirection: "column",
              gap: 18,
              borderColor: plan.flagship ? "var(--brass)" : undefined,
            }}
          >
            <span
              className="mono-label"
              style={{ color: plan.flagship ? "var(--brass-bright)" : undefined }}
            >
              {plan.label}
            </span>
            <div className="display" style={{ fontSize: 42 }}>
              {plan.price}
              <span className="mono-label" style={{ marginLeft: 10 }}>/ month</span>
            </div>
            <ul style={{ listStyle: "none", display: "grid", gap: 8, flexGrow: 1 }}>
              {plan.includes.map((inc) => (
                <li
                  key={inc}
                  style={{ display: "flex", gap: 10, fontSize: 14.5, color: "var(--parchment-dim)" }}
                >
                  <span style={{ color: "var(--brass)" }}>—</span> {inc}
                </li>
              ))}
            </ul>
            <button
              className={`btn${plan.flagship ? "" : " btn--ghost"}`}
              disabled={working !== ""}
              onClick={() => subscribe(plan.id)}
            >
              {working === plan.id ? (
                <>
                  <span className="spin" /> Redirecting…
                </>
              ) : (
                `Choose ${plan.label}`
              )}
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn--ghost btn--small" onClick={openPortal} disabled={working !== ""}>
        {working === "portal" ? "Opening…" : "Manage existing subscription →"}
      </button>
    </div>
  );
}
