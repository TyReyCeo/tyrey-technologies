"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Doc = {
  id: string;
  project_id: string;
  type: string;
  title: string;
  version: number;
  created_at: string;
};

export default function VaultPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Doc[]>("/vault", { auth: true })
      .then((data) => {
        setDocs(data);
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div style={{ maxWidth: 1040 }}>
      <p className="eyebrow" style={{ marginBottom: 12 }}>
        Workspace / Vault
      </p>
      <h1 className="display" style={{ fontSize: 36, marginBottom: 8 }}>
        Document vault
      </h1>
      <p style={{ color: "var(--parchment-dim)", marginBottom: 38 }}>
        Every deliverable generated across your projects, in one place.
      </p>

      {error && <div className="error-note" style={{ marginBottom: 20 }}>{error}</div>}

      {loaded && docs.length === 0 && (
        <p style={{ color: "var(--parchment-dim)" }}>
          The vault is empty — generate a document from any{" "}
          <Link href="/dashboard" style={{ color: "var(--brass)" }}>
            project workspace
          </Link>
          .
        </p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {docs.map((doc) => (
          <Link
            key={doc.id}
            href={`/dashboard/documents/${doc.id}`}
            className="panel"
            style={{
              padding: "18px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p className="mono-label" style={{ fontSize: 10, marginBottom: 4 }}>
                {doc.type.replace(/_/g, " ")}
              </p>
              <span style={{ fontSize: 15.5 }}>{doc.title}</span>
            </div>
            <span className="mono-label" style={{ fontSize: 10 }}>
              v{doc.version} · {new Date(doc.created_at).toLocaleDateString()} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
