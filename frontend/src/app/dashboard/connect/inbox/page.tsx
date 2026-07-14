"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  ConnectNumber,
  Contact,
  Conversation,
  formatPhone,
  formatWhen,
  isDemo,
} from "@/lib/connect";
import { AuthorBadge, ConnectHeader } from "../parts";

const POLL_MS = 10_000;

function InboxPage() {
  const params = useSearchParams();
  const [numbers, setNumbers] = useState<ConnectNumber[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [thread, setThread] = useState<Conversation | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(params.get("c"));
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);

  // New-conversation composer
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [composing, setComposing] = useState(false);
  const [newContactId, setNewContactId] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(() => {
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    api<Conversation[]>(`/connect/conversations${qs}`, { auth: true })
      .then((data) => {
        setConversations(data);
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  }, [statusFilter]);

  const loadThread = useCallback((id: string) => {
    api<Conversation>(`/connect/conversations/${id}`, { auth: true })
      .then(setThread)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    api<ConnectNumber[]>("/connect/numbers", { auth: true })
      .then(setNumbers)
      .catch(() => undefined);
    api<Contact[]>("/connect/contacts", { auth: true })
      .then(setContacts)
      .catch(() => undefined);
  }, []);

  // Inbox polling (~10s, per ARCHITECTURE.md §7)
  useEffect(() => {
    loadConversations();
    const timer = setInterval(loadConversations, POLL_MS);
    return () => clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    loadThread(selectedId);
    const timer = setInterval(() => loadThread(selectedId), POLL_MS);
    return () => clearInterval(timer);
  }, [selectedId, loadThread]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages?.length]);

  const send = async () => {
    if (!draft.trim()) return;
    setSending(true);
    setError("");
    try {
      if (composing) {
        if (!newContactId) throw new Error("Pick a contact first.");
        const created = await api<Conversation>("/connect/conversations", {
          auth: true,
          method: "POST",
          body: { contact_id: newContactId, body: draft.trim() },
        });
        setComposing(false);
        setSelectedId(created.id);
        setThread(created);
      } else if (thread) {
        const updated = await api<Conversation>(
          `/connect/conversations/${thread.id}/messages`,
          { auth: true, method: "POST", body: { body: draft.trim() } }
        );
        setThread(updated);
      }
      setDraft("");
      loadConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed.");
    }
    setSending(false);
  };

  const insertAiDraft = async () => {
    if (!thread) return;
    setDrafting(true);
    setError("");
    try {
      // Insert-to-edit: the draft lands in the box; sending stays explicit.
      const res = await api<{ draft: string; demo: boolean }>(
        `/connect/conversations/${thread.id}/ai-draft`,
        { auth: true, method: "POST" }
      );
      setDraft(res.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI draft failed.");
    }
    setDrafting(false);
  };

  const patchThread = async (body: Record<string, unknown>) => {
    if (!thread) return;
    try {
      await api(`/connect/conversations/${thread.id}`, {
        auth: true,
        method: "PATCH",
        body,
      });
      loadThread(thread.id);
      loadConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  };

  const selectConversation = (id: string) => {
    setComposing(false);
    setSelectedId(id);
    setDraft("");
  };

  return (
    <div style={{ maxWidth: 1120 }}>
      <ConnectHeader demo={isDemo(numbers)} />
      {error && <div className="error-note" style={{ marginBottom: 20 }}>{error}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 340px) 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Conversation list */}
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: "1px solid var(--line)",
              gap: 10,
            }}
          >
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: 13 }}
              aria-label="Filter by status"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
            <button
              className="btn btn--ghost btn--small"
              onClick={() => {
                setComposing(true);
                setThread(null);
                setSelectedId(null);
                setDraft("");
              }}
            >
              + New
            </button>
          </div>
          <div style={{ maxHeight: 560, overflowY: "auto" }}>
            {loaded && conversations.length === 0 && (
              <p style={{ padding: 18, color: "var(--parchment-dim)", fontSize: 14 }}>
                No conversations{statusFilter ? ` (${statusFilter})` : ""} yet.
              </p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "14px 16px",
                  background:
                    c.id === selectedId ? "rgba(110,43,54,0.08)" : "transparent",
                  borderLeft: `2px solid ${
                    c.id === selectedId ? "var(--brass)" : "transparent"
                  }`,
                  borderBottom: "1px solid var(--line)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{c.contact.name}</span>
                  <span className="mono-label" style={{ fontSize: 9 }}>
                    {formatWhen(c.last_message_at)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--parchment-dim)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.last_message_preview || "—"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Thread view / composer */}
        <div className="panel" style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 560 }}>
          {composing ? (
            <div style={{ padding: 24 }}>
              <p className="mono-label" style={{ color: "var(--brass)", marginBottom: 16 }}>
                New conversation
              </p>
              <div className="field" style={{ marginBottom: 16 }}>
                <label htmlFor="ncontact">Contact</label>
                <select
                  id="ncontact"
                  value={newContactId}
                  onChange={(e) => setNewContactId(e.target.value)}
                >
                  <option value="">Select a contact…</option>
                  {contacts
                    .filter((c) => !c.sms_opt_out)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {formatPhone(c.phone_e164)}
                      </option>
                    ))}
                </select>
              </div>
              {contacts.length === 0 && (
                <p style={{ fontSize: 13, color: "var(--parchment-dim)", marginBottom: 12 }}>
                  No contacts yet — add one under Contacts first.
                </p>
              )}
            </div>
          ) : thread ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--line)",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>{thread.contact.name}</p>
                  <p className="mono-label" style={{ fontSize: 10 }}>
                    {formatPhone(thread.contact.phone_e164)}
                    {thread.contact.sms_opt_out && (
                      <span style={{ color: "var(--oxblood)" }}> · OPTED OUT</span>
                    )}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={thread.status}
                    onChange={(e) => patchThread({ status: e.target.value })}
                    style={{ fontSize: 12 }}
                    aria-label="Conversation status"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="closed">Closed</option>
                  </select>
                  <input
                    placeholder="Assign to…"
                    defaultValue={thread.assigned_to ?? ""}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (thread.assigned_to ?? "")) {
                        patchThread({ assigned_to: v || null });
                      }
                    }}
                    style={{ fontSize: 12, width: 110 }}
                    aria-label="Assign conversation"
                  />
                  <label
                    className="mono-label"
                    style={{ fontSize: 10, display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={thread.ai_enabled}
                      onChange={(e) => patchThread({ ai_enabled: e.target.checked })}
                    />
                    AI auto-reply
                  </label>
                </div>
              </div>

              <div
                ref={scrollRef}
                style={{
                  flexGrow: 1,
                  overflowY: "auto",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  maxHeight: 420,
                }}
              >
                {(thread.messages ?? []).map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.direction === "out" ? "flex-end" : "flex-start",
                      maxWidth: "72%",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 14px",
                        fontSize: 14,
                        lineHeight: 1.5,
                        background:
                          m.direction === "out"
                            ? "rgba(110,43,54,0.10)"
                            : "rgba(0,0,0,0.04)",
                        border: "1px solid var(--line)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {m.body}
                    </div>
                    <p
                      className="mono-label"
                      style={{
                        fontSize: 9,
                        marginTop: 4,
                        textAlign: m.direction === "out" ? "right" : "left",
                      }}
                    >
                      {formatWhen(m.created_at)} · {m.status}
                      {m.error ? ` (${m.error})` : ""}
                      <AuthorBadge author={m.author} />
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <p style={{ color: "var(--parchment-dim)" }}>
                {loaded ? "Select a conversation or start a new one." : "Loading…"}
              </p>
            </div>
          )}

          {/* Send box */}
          {(thread || composing) && (
            <div style={{ borderTop: "1px solid var(--line)", padding: 16 }}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  thread?.contact.sms_opt_out
                    ? "This contact has opted out — sending is blocked."
                    : "Type a message… (Enter to send, Shift+Enter for newline)"
                }
                disabled={sending || thread?.contact.sms_opt_out}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                style={{ width: "100%", minHeight: 64, marginBottom: 10, fontSize: 14 }}
                maxLength={1600}
                aria-label="Message body"
              />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  {thread && (
                    <button
                      className="btn btn--ghost btn--small"
                      onClick={insertAiDraft}
                      disabled={drafting || thread.contact.sms_opt_out}
                    >
                      {drafting ? (
                        <>
                          <span className="spin" /> Drafting…
                        </>
                      ) : (
                        "✦ AI Draft"
                      )}
                    </button>
                  )}
                  <span className="mono-label" style={{ fontSize: 9, alignSelf: "center" }}>
                    {draft.length}/1600
                  </span>
                </div>
                <button
                  className="btn btn--small"
                  onClick={send}
                  disabled={sending || !draft.trim() || thread?.contact.sms_opt_out}
                >
                  {sending ? (
                    <>
                      <span className="spin" /> Sending…
                    </>
                  ) : (
                    "Send →"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InboxPageWrapper() {
  return (
    <Suspense>
      <InboxPage />
    </Suspense>
  );
}
