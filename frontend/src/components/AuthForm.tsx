"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api<{ token: string }>(`/auth/${mode}`, {
        method: "POST",
        body: { email, password },
      });
      setToken(data.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        zIndex: 2,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Link
          href="/"
          className="display"
          style={{ fontSize: 22, display: "block", textAlign: "center", marginBottom: 34 }}
        >
          TyRey Intelligence™
        </Link>
        <form
          onSubmit={submit}
          className="panel panel--corners"
          style={{ padding: 40, display: "grid", gap: 22 }}
        >
          <div>
            <p className="eyebrow" style={{ marginBottom: 10 }}>
              {mode === "login" ? "Member access" : "Open your workspace"}
            </p>
            <h1 className="display" style={{ fontSize: 28 }}>
              {mode === "login" ? "Sign in" : "Create account"}
            </h1>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password {mode === "signup" && "(min. 8 characters)"}</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="error-note">{error}</div>}

          <button className="btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spin" /> One moment…
              </>
            ) : mode === "login" ? (
              "Enter Workspace →"
            ) : (
              "Create Account →"
            )}
          </button>

          <p className="mono-label" style={{ textAlign: "center" }}>
            {mode === "login" ? (
              <>
                New here?{" "}
                <Link href="/signup" style={{ color: "var(--brass)" }}>
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already a member?{" "}
                <Link href="/login" style={{ color: "var(--brass)" }}>
                  Sign in
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
    </main>
  );
}
