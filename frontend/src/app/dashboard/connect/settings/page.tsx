"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ConnectNumber, ConnectProfile, formatPhone, isDemo } from "@/lib/connect";
import { ConnectHeader } from "../parts";

export default function ConnectSettingsPage() {
  const [numbers, setNumbers] = useState<ConnectNumber[]>([]);
  const [profile, setProfile] = useState<ConnectProfile | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [businessProfile, setBusinessProfile] = useState("");
  const [aiAutoReply, setAiAutoReply] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [areaCode, setAreaCode] = useState("");
  const [tollFree, setTollFree] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  const loadNumbers = () =>
    api<ConnectNumber[]>("/connect/numbers", { auth: true })
      .then(setNumbers)
      .catch((e) => setError(e.message));

  useEffect(() => {
    loadNumbers();
    api<ConnectProfile>("/connect/profile", { auth: true })
      .then((p) => {
        setProfile(p);
        setBusinessName(p.business_name);
        setBusinessProfile(p.business_profile);
        setAiAutoReply(p.ai_auto_reply);
      })
      .catch((e) => setError(e.message));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError("");
    setNotice("");
    try {
      const p = await api<ConnectProfile>("/connect/profile", {
        auth: true,
        method: "PUT",
        body: {
          business_name: businessName,
          business_profile: businessProfile,
          ai_auto_reply: aiAutoReply,
        },
      });
      setProfile(p);
      setNotice("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    }
    setSavingProfile(false);
  };

  const provision = async () => {
    setProvisioning(true);
    setError("");
    setNotice("");
    try {
      await api("/connect/numbers", {
        auth: true,
        method: "POST",
        body: { area_code: areaCode.trim() || null, toll_free: tollFree },
      });
      setAreaCode("");
      setTollFree(false);
      loadNumbers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not provision a number.");
    }
    setProvisioning(false);
  };

  const release = async (n: ConnectNumber) => {
    if (
      !window.confirm(
        `Release ${formatPhone(n.e164)}? Texting from this number stops immediately.`
      )
    ) {
      return;
    }
    setError("");
    try {
      await api(`/connect/numbers/${n.id}`, { auth: true, method: "DELETE" });
      loadNumbers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Release failed.");
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <ConnectHeader demo={isDemo(numbers)} />
      {error && <div className="error-note" style={{ marginBottom: 20 }}>{error}</div>}
      {notice && (
        <p className="mono-label" style={{ color: "var(--emerald)", marginBottom: 20 }}>
          {notice}
        </p>
      )}

      <form
        onSubmit={saveProfile}
        className="panel panel--corners"
        style={{ padding: 30, display: "grid", gap: 18, marginBottom: 32 }}
      >
        <span className="mono-label" style={{ color: "var(--brass)" }}>
          AI receptionist
        </span>
        <label
          style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", fontSize: 14 }}
        >
          <input
            type="checkbox"
            checked={aiAutoReply}
            onChange={(e) => setAiAutoReply(e.target.checked)}
          />
          Auto-reply to new inbound messages with the AI receptionist
        </label>
        <p style={{ fontSize: 13, color: "var(--parchment-dim)", marginTop: -8 }}>
          The kill switch for AI across all conversations. AI-sent messages are
          always labeled, and STOP/HELP keywords are handled before AI ever
          sees a message. You can also toggle AI per conversation in the inbox.
        </p>
        <div className="field">
          <label htmlFor="bname">Business name</label>
          <input
            id="bname"
            placeholder="e.g. Main Street Barbershop"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            maxLength={200}
          />
        </div>
        <div className="field">
          <label htmlFor="bprofile">Business profile (feeds the AI receptionist)</label>
          <textarea
            id="bprofile"
            placeholder="Hours, services, pricing, policies… The AI only answers from what you write here — anything missing gets escalated to you."
            value={businessProfile}
            onChange={(e) => setBusinessProfile(e.target.value)}
            style={{ minHeight: 140 }}
            maxLength={8000}
          />
        </div>
        <div>
          <button className="btn" disabled={savingProfile}>
            {savingProfile ? (
              <>
                <span className="spin" /> Saving…
              </>
            ) : (
              "Save Settings →"
            )}
          </button>
          {profile && (
            <span className="mono-label" style={{ fontSize: 9, marginLeft: 14 }}>
              Last saved {new Date(profile.updated_at).toLocaleString()}
            </span>
          )}
        </div>
      </form>

      <div className="panel" style={{ padding: 30, display: "grid", gap: 18 }}>
        <span className="mono-label" style={{ color: "var(--brass)" }}>
          Phone numbers
        </span>
        {numbers.length === 0 && (
          <p style={{ fontSize: 14, color: "var(--parchment-dim)" }}>
            No numbers yet — provision one below.
          </p>
        )}
        {numbers.map((n) => (
          <div
            key={n.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              borderBottom: "1px solid var(--line)",
              paddingBottom: 14,
            }}
          >
            <div>
              <p className="display" style={{ fontSize: 20 }}>
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
              {n.status === "pending_registration" && (
                <p style={{ fontSize: 12, color: "var(--parchment-dim)", marginTop: 4 }}>
                  Carrier registration (10DLC/toll-free) is in progress — real
                  sends unlock when it completes.
                </p>
              )}
            </div>
            <button className="btn btn--ghost btn--small" onClick={() => release(n)}>
              Release
            </button>
          </div>
        ))}

        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ maxWidth: 140 }}>
            <label htmlFor="acode">Area code (optional)</label>
            <input
              id="acode"
              placeholder="515"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
            />
          </div>
          <label
            className="mono-label"
            style={{
              fontSize: 10,
              display: "flex",
              gap: 6,
              alignItems: "center",
              cursor: "pointer",
              paddingBottom: 12,
            }}
          >
            <input
              type="checkbox"
              checked={tollFree}
              onChange={(e) => setTollFree(e.target.checked)}
            />
            Toll-free
          </label>
          <div style={{ paddingBottom: 2 }}>
            <button className="btn btn--small" onClick={provision} disabled={provisioning} type="button">
              {provisioning ? (
                <>
                  <span className="spin" /> Provisioning…
                </>
              ) : (
                "Provision Number →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
