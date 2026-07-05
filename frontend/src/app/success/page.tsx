"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Markdown from "@/components/Markdown";
import { API_URL, api } from "@/lib/api";

type Order = {
  id: string;
  tier: string;
  status: string;
  content: string | null;
};

function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get("order_id");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  const poll = useCallback(async () => {
    if (!orderId) return;
    try {
      const data = await api<Order>(`/funnel/order/${orderId}`);
      setOrder(data);
      return data.status;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load order.");
      return "failed";
    }
  }, [orderId]);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const status = await poll();
      if (active && status !== "generated" && status !== "failed") {
        setTimeout(tick, 3000);
      }
    };
    tick();
    return () => {
      active = false;
    };
  }, [poll]);

  if (!orderId) {
    return (
      <Shell>
        <div className="error-note">Missing order reference.</div>
      </Shell>
    );
  }

  return (
    <Shell>
      {error && <div className="error-note">{error}</div>}

      {!order || (order.status !== "generated" && order.status !== "failed") ? (
        <div className="panel panel--corners" style={{ padding: 48, textAlign: "center" }}>
          <p className="eyebrow" style={{ justifyContent: "center", marginBottom: 20 }}>
            Payment received
          </p>
          <h1 className="display" style={{ fontSize: 34, marginBottom: 14 }}>
            Your Investor Business Pack is being generated…
          </h1>
          <p style={{ color: "var(--parchment-dim)", maxWidth: 480, margin: "0 auto" }}>
            The intelligence engine is running your idea through the framework
            library. This usually takes one to three minutes. This page will
            update automatically.
          </p>
          <div style={{ marginTop: 30 }}>
            <span
              className="spin"
              style={{
                width: 22,
                height: 22,
                borderColor: "rgba(110,43,54,0.25)",
                borderTopColor: "var(--oxblood)",
              }}
            />
          </div>
        </div>
      ) : order.status === "failed" ? (
        <div className="error-note">
          Generation hit a problem. Your payment is recorded — contact support
          with order ID {order.id}.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 30,
            }}
          >
            <div>
              <p className="eyebrow" style={{ marginBottom: 10 }}>
                Deliverable ready
              </p>
              <h1 className="display" style={{ fontSize: 32 }}>
                Your pack is ready to download.
              </h1>
            </div>
            <a className="btn" href={`${API_URL}/funnel/order/${order.id}/pdf`}>
              Download PDF ↓
            </a>
          </div>
          <div className="panel" style={{ padding: "clamp(24px, 4vw, 48px)" }}>
            <Markdown content={order.content || ""} />
          </div>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "40px clamp(24px, 5vw, 60px) 100px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <header style={{ marginBottom: 50, display: "flex", justifyContent: "space-between" }}>
        <Link href="/" className="display" style={{ fontSize: 20 }}>
          TyRey Intelligence™
        </Link>
        <Link href="/signup" className="mono-label">
          Save future work → create account
        </Link>
      </header>
      {children}
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
