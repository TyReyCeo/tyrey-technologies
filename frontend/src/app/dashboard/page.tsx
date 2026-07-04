"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Project = {
  id: string;
  name: string;
  objective: string;
  industry: string;
  stage: string;
  created_at: string;
};

const OBJECTIVES = [
  { value: "start_company", label: "Start a company" },
  { value: "raise_capital", label: "Raise capital" },
  { value: "acquire_business", label: "Acquire a business" },
  { value: "expand_market", label: "Expand market" },
  { value: "improve_operations", label: "Improve operations" },
  { value: "evaluate_investment", label: "Evaluate investment" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [objective, setObjective] = useState("start_company");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("idea");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api<Project[]>("/projects", { auth: true })
      .then((data) => {
        setProjects(data);
        setLoaded(true);
        if (data.length === 0) setShowForm(true);
      })
      .catch((e) => setError(e.message));
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const project = await api<Project>("/projects", {
        auth: true,
        method: "POST",
        body: { name, objective, industry, stage, notes: notes || null },
      });
      window.location.href = `/dashboard/projects/${project.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project.");
      setCreating(false);
    }
  };

  return (
    <div style={{ maxWidth: 1040 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 36,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            Workspace / Projects
          </p>
          <h1 className="display" style={{ fontSize: 36 }}>
            Strategic projects
          </h1>
        </div>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close" : "+ New Project"}
        </button>
      </div>

      {error && <div className="error-note" style={{ marginBottom: 20 }}>{error}</div>}

      {showForm && (
        <form
          onSubmit={create}
          className="panel panel--corners"
          style={{ padding: 34, display: "grid", gap: 20, marginBottom: 44 }}
        >
          <span className="mono-label" style={{ color: "var(--brass)" }}>
            Project intake
          </span>
          <div className="field">
            <label htmlFor="pname">Project name</label>
            <input
              id="pname"
              required
              placeholder="e.g. Perry Pivot — downtown revitalization fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 20,
            }}
          >
            <div className="field">
              <label htmlFor="pobjective">Objective</label>
              <select
                id="pobjective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              >
                {OBJECTIVES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pindustry">Industry</label>
              <input
                id="pindustry"
                required
                placeholder="e.g. Community investment"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="pstage">Stage</label>
              <select id="pstage" value={stage} onChange={(e) => setStage(e.target.value)}>
                <option value="idea">Idea</option>
                <option value="early">Early</option>
                <option value="growth">Growth</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="pnotes">Notes (optional)</label>
            <textarea
              id="pnotes"
              placeholder="Anything the intelligence engine should know — constraints, goals, context…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ minHeight: 80 }}
            />
          </div>
          <div>
            <button className="btn" disabled={creating}>
              {creating ? (
                <>
                  <span className="spin" /> Creating…
                </>
              ) : (
                "Create Project →"
              )}
            </button>
          </div>
        </form>
      )}

      {loaded && projects.length === 0 && !showForm && (
        <p style={{ color: "var(--parchment-dim)" }}>
          No projects yet — create your first strategic project to begin.
        </p>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {projects.map((project, i) => (
          <Link
            key={project.id}
            href={`/dashboard/projects/${project.id}`}
            className="panel"
            style={{
              padding: "26px 30px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p className="mono-label" style={{ fontSize: 10, marginBottom: 6 }}>
                PRJ-{String(projects.length - i).padStart(3, "0")} ·{" "}
                {OBJECTIVES.find((o) => o.value === project.objective)?.label ??
                  project.objective}
              </p>
              <h2 className="display" style={{ fontSize: 23 }}>
                {project.name}
              </h2>
            </div>
            <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
              <span className="mono-label">{project.industry}</span>
              <span
                className="mono-label"
                style={{
                  color: "var(--emerald)",
                  border: "1px solid rgba(59,165,127,0.35)",
                  padding: "4px 10px",
                }}
              >
                {project.stage}
              </span>
              <span style={{ color: "var(--brass)", fontSize: 20 }}>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
