import { ImageResponse } from "next/og";

export const alt = "Demiurgos — Tu director creativo para redes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#06080a",
          backgroundImage:
            "radial-gradient(60% 80% at 78% 0%, rgba(34,214,122,0.22), transparent), radial-gradient(55% 75% at 12% 100%, rgba(24,168,95,0.28), transparent)",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: "#0A0D0E",
              border: "1px solid rgba(34,214,122,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#22d67a",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            D
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, color: "#ecf3ee" }}>Demiurgos</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, color: "#ecf3ee", lineHeight: 1.02, letterSpacing: -2 }}>
            Publica con criterio.
          </div>
          <div style={{ fontSize: 76, fontWeight: 700, color: "#22d67a", lineHeight: 1.02, letterSpacing: -2 }}>
            No por inercia.
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#9eb4ab", maxWidth: 940, lineHeight: 1.35 }}>
            Tu director creativo personal: qué publicar, cuándo y por qué. Nada que pudiera haber escrito cualquiera.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 24, color: "#5e7870" }}>
          LinkedIn · YouTube · TikTok · Instagram · X · Substack
        </div>
      </div>
    ),
    { ...size },
  );
}
