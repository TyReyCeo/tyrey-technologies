"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Markdown from "@/components/Markdown";
import { API_URL, api, getToken } from "@/lib/api";

type Doc = {
  id: string;
  project_id: string;
  type: string;
  title: string;
  content: string;
  version: number;
};

export default function DocumentViewer() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [instruction, setInstruction] = useState("");
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Doc>(`/documents/${id}`, { auth: true })
      .then(setDoc)
      .catch((e) => setError(e.message));
  }, [id]);

  const editWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;
    setEditing(true);
    setError("");
    try {
      const updated = await api<Doc>(`/documents/${id}/edit`, {
        auth: true,
        method: "POST",
        body: { instruction },
      });
      setDoc(updated);
      setInstruction("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Edit failed.");
    } finally {
      setEditing(false);
    }
  };

  const downloadPdf = async () => {
    setDownloading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/documents/${id}/pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("PDF export failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tyrey-${doc?.type.replace(/_/g, "-") ?? "document"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed.");
    } finally {
      setDownloading(false);
    }
  };

  if (!doc) {
    return error ? <div className="error-note">{error}</div> : null;
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <p className="eyebrow" style={{ marginBottom: 12 }}>
        <Link href="/dashboard" style={{ color: "var(--brass)" }}>
          Projects
        </Link>{" "}
        /{" "}
        <Link href={`/dashboard/projects/${doc.project_id}`} style={{ color: "var(--brass)" }}>
          Workspace
        </Link>{" "}
        / Document
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 18,
          flexWrap: "wrap",
          marginBottom: 30,
        }}
      >
        <div>
          <h1 className="display" style={{ fontSize: 30 }}>
            {doc.title}
          </h1>
          <p className="mono-label" style={{ marginTop: 6 }}>
            Version {doc.version}
          </p>
        </div>
        <button className="btn" onClick={downloadPdf} disabled={downloading}>
          {downloading ? (
            <>
              <span className="spin" /> Exporting…
            </>
          ) : (
            "Download PDF ↓"
          )}
        </button>
      </div>

      {/* Edit with AI */}
      <form
        onSubmit={editWithAI}
        className="panel panel--corners"
        style={{ padding: 24, marginBottom: 34, display: "grid", gap: 14 }}
      >
        <span className="mono-label" style={{ color: "var(--brass)" }}>
          Edit with AI
        </span>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            aria-label="Edit instruction"
            placeholder='e.g. "Sharpen the executive summary and add a competitor table"'
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            style={{
              flexGrow: 1,
              minWidth: 260,
              background: "rgba(243,237,218,0.04)",
              border: "1px solid var(--line)",
              color: "var(--parchment)",
              padding: "12px 16px",
              fontSize: 15,
            }}
          />
          <button className="btn btn--ghost" disabled={editing}>
            {editing ? (
              <>
                <span className="spin" /> Revising…
              </>
            ) : (
              "Apply →"
            )}
          </button>
        </div>
      </form>

      {error && <div className="error-note" style={{ marginBottom: 24 }}>{error}</div>}

      <article className="panel" style={{ padding: "clamp(26px, 4vw, 50px)" }}>
        <Markdown content={doc.content} />
      </article>
    </div>
  );
}
