import { splitH2Sections } from "./parse-markdown";
import { type PlatformKey } from "../lib/ai/platforms";

// Mapea cada ficha de red de CONOCIMIENTO_REDES.md a una clave canónica.
const HEADING_TO_KEY: { test: RegExp; key: PlatformKey }[] = [
  { test: /linkedin/i, key: "linkedin" },
  { test: /youtube/i, key: "youtube" },
  { test: /tiktok/i, key: "tiktok" },
  { test: /instagram/i, key: "instagram" },
  { test: /^x\b|twitter/i, key: "x" },
  { test: /substack/i, key: "substack" },
];

export type KnowledgeSeed = { platform: PlatformKey; content: string };

// Extrae una fila por red (capa 4). Ignora secciones que no son fichas de red
// (principios transversales, tabla resumen, protocolo, fuentes).
export function parseConocimiento(md: string): KnowledgeSeed[] {
  const rows: KnowledgeSeed[] = [];
  const seen = new Set<PlatformKey>();

  for (const section of splitH2Sections(md)) {
    const match = HEADING_TO_KEY.find((h) => h.test.test(section.heading));
    if (!match || seen.has(match.key)) continue;
    seen.add(match.key);
    rows.push({
      platform: match.key,
      content: `## ${section.heading}\n${section.body}`.trim(),
    });
  }

  return rows;
}
