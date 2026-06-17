import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Founder Kit — Find Grants & Form Your Company";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F0F4FA",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: "#1B3F7B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 14 14" fill="none">
            <path d="M2 12V5l5-3 5 3v7H9V9H5v3H2z" fill="white" />
          </svg>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#111827",
            letterSpacing: "-1px",
            marginBottom: 20,
          }}
        >
          Founder Kit
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#4B5563",
            textAlign: "center",
            maxWidth: 760,
            lineHeight: 1.4,
            marginBottom: 48,
          }}
        >
          Form. Register. Fund.
        </div>

        {/* Pills */}
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Entity Formation", color: "#1B3F7B" },
            { label: "Federal Registration", color: "#7c3aed" },
            { label: "Grant Discovery", color: "#b45309" },
            { label: "AI Pitch Drafts", color: "#1a5c3a" },
          ].map((p) => (
            <div
              key={p.label}
              style={{
                background: p.color,
                color: "white",
                borderRadius: 24,
                padding: "10px 22px",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {p.label}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "#9CA3AF",
          }}
        >
          myfounderkit.com
        </div>
      </div>
    ),
    { ...size }
  );
}
