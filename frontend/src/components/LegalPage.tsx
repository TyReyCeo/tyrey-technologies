import Link from "next/link";

export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        maxWidth: 780,
        margin: "0 auto",
        padding: "40px clamp(24px, 5vw, 60px) 90px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <header
        style={{ marginBottom: 44, display: "flex", justifyContent: "space-between", gap: 16 }}
      >
        <Link href="/" className="display" style={{ fontSize: 20 }}>
          TyRey Intelligence™
        </Link>
        <nav style={{ display: "flex", gap: 20 }}>
          <Link href="/terms" className="mono-label">
            Terms
          </Link>
          <Link href="/privacy" className="mono-label">
            Privacy
          </Link>
        </nav>
      </header>

      <p className="eyebrow" style={{ marginBottom: 14 }}>
        TyRey Technologies, Inc. · Last updated July 2026
      </p>
      <h1 className="display" style={{ fontSize: 38, marginBottom: 30 }}>
        {title}
      </h1>

      <article className="panel dossier" style={{ padding: "clamp(26px, 4vw, 48px)" }}>
        {children}
      </article>

      <p className="mono-label" style={{ marginTop: 26 }}>
        Template — have an attorney review before relying on it.{" "}
        <Link href="/" style={{ color: "var(--brass)" }}>
          ← Back to TyRey Intelligence
        </Link>
      </p>
    </main>
  );
}
