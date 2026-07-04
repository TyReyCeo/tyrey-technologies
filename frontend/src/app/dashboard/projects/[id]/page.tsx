"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

type Project = {
  id: string;
  name: string;
  objective: string;
  industry: string;
  stage: string;
  notes: string | null;
};

type Module = {
  name: string;
  title: string;
  category: string;
  description: string;
  trademark: boolean;
};

type Doc = {
  id: string;
  type: string;
  title: string;
  version: number;
  created_at: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  core_deliverable: "Core Deliverables",
  diagnostic: "Diagnostics",
  framework: "Strategic Frameworks",
};

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [generating, setGenerating] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    api<Doc[]>(`/projects/${id}/documents`, { auth: true })
      .then(setDocs)
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    api<Project>(`/projects/${id}`, { auth: true })
      .then(setProject)
      .catch((e) => setError(e.message));
    api<Module[]>("/projects/modules", { auth: true }).then(setModules).catch(() => {});
    refresh();
  }, [id, refresh]);

  const generate = async (moduleName: string) => {
    setError("");
    setGenerating(moduleName);
    try {
      const doc = await api<Doc>(`/projects/${id}/generate`, {
        auth: true,
        method: "POST",
        body: { module: moduleName },
      });
      window.location.href = `/dashboard/documents/${doc.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
      setGenerating("");
    }
  };

  const grouped = modules.reduce<Record<string, Module[]>>((acc, m) => {
    (acc[m.category] = acc[m.category] || []).push(m);
    return acc;
  }, {});

  if (!project) {
    return error ? <div className="error-note">{error}</div> : null;
  }

  return (
    <div style={{ maxWidth: 1080 }}>
      <p className="eyebrow" style={{ marginBottom: 12 }}>
        <Link href="/dashboard" style={{ color: "var(--brass)" }}>
          Projects
        </Link>{" "}
        / Workspace
      </p>
      <h1 className="display" style={{ fontSize: 36, marginBottom: 10 }}>
        {project.name}
      </h1>
      <p className="mono-label" style={{ marginBottom: 40 }}>
        {project.industry} · {project.stage} ·{" "}
        {project.objective.replace(/_/g, " ")}
      </p>

      {error && <div className="error-note" style={{ marginBottom: 24 }}>{error}</div>}

      {/* module catalog */}
      {Object.entries(grouped).map(([category, mods]) => (
        <section key={category} style={{ marginBottom: 46 }}>
          <h2 className="mono-label" style={{ color: "var(--brass)", marginBottom: 18 }}>
            {CATEGORY_LABEL[category] ?? category} — {mods.length} modules
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {mods.map((mod) => (
              <div
                key={mod.name}
                className="panel"
                style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}
              >
                <h3 className="display" style={{ fontSize: 19 }}>
                  {mod.title}
                </h3>
                <p style={{ fontSize: 13.5, color: "var(--parchment-dim)", flexGrow: 1, lineHeight: 1.6 }}>
                  {mod.description}
                </p>
                <button
                  className="btn btn--ghost btn--small"
                  disabled={generating !== ""}
                  onClick={() => generate(mod.name)}
                >
                  {generating === mod.name ? (
                    <>
                      <span className="spin" /> Generating…
                    </>
                  ) : (
                    "Generate →"
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* project documents */}
      <section>
        <h2 className="mono-label" style={{ color: "var(--brass)", marginBottom: 18 }}>
          Project documents — {docs.length}
        </h2>
        {docs.length === 0 ? (
          <p style={{ color: "var(--parchment-dim)", fontSize: 14.5 }}>
            Nothing generated yet. Run a module above — outputs are saved here
            automatically.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href={`/dashboard/documents/${doc.id}`}
                className="panel"
                style={{
                  padding: "16px 22px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 15 }}>{doc.title}</span>
                <span className="mono-label" style={{ fontSize: 10 }}>
                  v{doc.version} · {new Date(doc.created_at).toLocaleDateString()} →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
