/**
 * Social-share (Open Graph) image, generated at build time.
 * Matches the dossier design system: ink canvas, brass accents.
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "TyRey Technologies — Building the Intelligence Infrastructure for Modern Business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b1512",
          padding: 72,
          fontFamily: "Georgia, serif",
        }}
      >
        {/* corner frame */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 36,
            right: 36,
            bottom: 36,
            border: "1px solid rgba(212, 193, 140, 0.35)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 26,
            letterSpacing: 6,
            color: "#c8a95e",
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 46, height: 2, background: "#c8a95e", display: "flex" }} />
          TyRey Technologies, Inc.
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 74,
              lineHeight: 1.1,
              color: "#f3edda",
              maxWidth: 980,
            }}
          >
            Building the{" "}
            <span style={{ color: "#e2c987", fontStyle: "italic" }}>
              Intelligence Infrastructure
            </span>{" "}
            for Modern Business.
          </div>
          <div style={{ fontSize: 28, color: "#d8d2bd" }}>
            AI-powered strategy, deal flow, and executive support.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 40,
            fontSize: 21,
            letterSpacing: 3,
            color: "#c8a95e",
            textTransform: "uppercase",
          }}
        >
          <span>TyRey Intelligence™</span>
          <span>Due Diligence Studio</span>
          <span>Acquisition Scout</span>
          <span>CEO in a Box</span>
        </div>
      </div>
    ),
    size
  );
}
