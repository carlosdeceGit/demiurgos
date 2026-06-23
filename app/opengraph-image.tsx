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
          background: "#faf9f7",
          backgroundImage:
            "radial-gradient(60% 80% at 75% 0%, rgba(109,94,240,0.18), transparent), radial-gradient(60% 80% at 20% 100%, rgba(15,157,107,0.20), transparent)",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "linear-gradient(150deg, #0f9d6b, #6d5ef0)",
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 600, color: "#1c1917" }}>Demiurgos</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 72, fontWeight: 700, color: "#1c1917", lineHeight: 1.05, letterSpacing: -2 }}>
            Tu director creativo.
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, color: "#0f9d6b", lineHeight: 1.05, letterSpacing: -2 }}>
            Que sabe quién eres.
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#44403c", maxWidth: 920, lineHeight: 1.35 }}>
            Decide qué publicar, cuándo y por qué. Sin posts que podría haber escrito cualquiera.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 24, color: "#78716c" }}>
          LinkedIn · YouTube · TikTok · Instagram · X · Substack
        </div>
      </div>
    ),
    { ...size },
  );
}
