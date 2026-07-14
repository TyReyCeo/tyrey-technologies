"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ConnectNumber, Contact, formatPhone, isDemo } from "@/lib/connect";
import { ConnectHeader } from "../parts";

type ImportResult = { imported: number; skipped: number; errors: string[] };

export default function ContactsPage() {
  const [numbers, setNumbers] = useState<ConnectNumber[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    const qs = query ? `?query=${encodeURIComponent(query)}` : "";
    api<Contact[]>(`/connect/contacts${qs}`, { auth: true })
      .then((data) => {
        setContacts(data);
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  }, [query]);

  useEffect(() => {
    api<ConnectNumber[]>("/connect/numbers", { auth: true })
      .then(setNumbers)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/connect/contacts", {
        auth: true,
        method: "POST",
        body: {
          name,
          phone_e164: phone.trim(),
          email: email.trim() || null,
          company: company.trim() || null,
        },
      });
      setName("");
      setPhone("");
      setEmail("");
      setCompany("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save contact.");
    }
    setSaving(false);
  };

  const importCsv = async (file: File) => {
    setImporting(true);
    setError("");
    setImportResult(null);
    try {
      const csv = await file.text();
      const result = await api<ImportResult>("/connect/contacts/import", {
        auth: true,
        method: "POST",
        body: { csv },
      });
      setImportResult(result);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const toggleOptOut = async (contact: Contact) => {
    try {
      await api(`/connect/contacts/${contact.id}`, {
        auth: true,
        method: "PATCH",
        body: { sms_opt_out: !contact.sms_opt_out },
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  };

  const remove = async (contact: Contact) => {
    if (!window.confirm(`Delete contact ${contact.name}?`)) return;
    setError("");
    try {
      await api(`/connect/contacts/${contact.id}`, { auth: true, method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div style={{ maxWidth: 1040 }}>
      <ConnectHeader demo={isDemo(numbers)} />
      {error && <div className="error-note" style={{ marginBottom: 20 }}>{error}</div>}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Search name, phone, company…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 320, flexGrow: 1 }}
          aria-label="Search contacts"
        />
        <div style={{ display: "flex", gap: 10 }}>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importCsv(file);
            }}
          />
          <button
            className="btn btn--ghost"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <>
                <span className="spin" /> Importing…
              </>
            ) : (
              "Import CSV"
            )}
          </button>
          <button className="btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "+ Add Contact"}
          </button>
        </div>
      </div>

      {importResult && (
        <div className="panel" style={{ padding: "18px 24px", marginBottom: 24 }}>
          <p className="mono-label" style={{ fontSize: 11, marginBottom: 8, color: "var(--brass)" }}>
            Import result
          </p>
          <p style={{ fontSize: 14 }}>
            {importResult.imported} imported · {importResult.skipped} skipped
          </p>
          {importResult.errors.length > 0 && (
            <ul style={{ marginTop: 8, paddingLeft: 18, fontSize: 13, color: "var(--parchment-dim)" }}>
              {importResult.errors.slice(0, 8).map((e) => (
                <li key={e}>{e}</li>
              ))}
              {importResult.errors.length > 8 && (
                <li>…and {importResult.errors.length - 8} more</li>
              )}
            </ul>
          )}
          <p className="mono-label" style={{ fontSize: 9, marginTop: 10 }}>
            CSV columns: name, phone (E.164, e.g. +15155550101), email, company
          </p>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={create}
          className="panel panel--corners"
          style={{ padding: 28, display: "grid", gap: 16, marginBottom: 28 }}
        >
          <span className="mono-label" style={{ color: "var(--brass)" }}>
            New contact
          </span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            <div className="field">
              <label htmlFor="cname">Name</label>
              <input id="cname" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cphone">Phone (E.164)</label>
              <input
                id="cphone"
                required
                placeholder="+15155550101"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="cemail">Email (optional)</label>
              <input
                id="cemail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="ccompany">Company (optional)</label>
              <input id="ccompany" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
          <div>
            <button className="btn" disabled={saving}>
              {saving ? (
                <>
                  <span className="spin" /> Saving…
                </>
              ) : (
                "Save Contact →"
              )}
            </button>
          </div>
        </form>
      )}

      {loaded && contacts.length === 0 && (
        <p style={{ color: "var(--parchment-dim)" }}>
          {query ? "No contacts match that search." : "No contacts yet — add one or import a CSV."}
        </p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {contacts.map((c) => (
          <div
            key={c.id}
            className="panel"
            style={{
              padding: "18px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ fontSize: 15, marginBottom: 4 }}>
                {c.name}
                {c.sms_opt_out && (
                  <span
                    className="mono-label"
                    style={{
                      fontSize: 9,
                      color: "var(--oxblood)",
                      border: "1px solid rgba(110,43,54,0.35)",
                      padding: "1px 6px",
                      marginLeft: 8,
                    }}
                  >
                    OPTED OUT
                  </span>
                )}
              </p>
              <p className="mono-label" style={{ fontSize: 10 }}>
                {formatPhone(c.phone_e164)}
                {c.company ? ` · ${c.company}` : ""}
                {c.email ? ` · ${c.email}` : ""} · via {c.source}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn--ghost btn--small" onClick={() => toggleOptOut(c)}>
                {c.sms_opt_out ? "Opt back in" : "Opt out"}
              </button>
              <button className="btn btn--ghost btn--small" onClick={() => remove(c)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
