/**
 * Social-share (Open Graph) image, generated at build time.
 * Matches "The Firm" design system: ivory paper, ink serif, oxblood accent.
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "TyRey Technologies — The intelligence infrastructure for modern business";
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
          background: "#faf7f1",
          padding: 72,
          fontFamily: "Georgia, serif",
        }}
      >
        {/* hairline frame */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 36,
            right: 36,
            bottom: 36,
            border: "1px solid #e2ddd0",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 6,
            color: "#6e2b36",
            textTransform: "uppercase",
          }}
        >
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
              display: "flex",
              flexDirection: "column",
              fontSize: 76,
              lineHeight: 1.06,
              color: "#1c1916",
            }}
          >
            <div style={{ display: "flex" }}>The intelligence</div>
            <div style={{ display: "flex" }}>infrastructure for</div>
            <div style={{ display: "flex" }}>
              modern business<span style={{ color: "#6e2b36" }}>.</span>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 27, color: "#55504a" }}>
            AI-powered strategy, deal flow, and executive support.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 40,
            fontSize: 20,
            letterSpacing: 3,
            color: "#8a847a",
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
