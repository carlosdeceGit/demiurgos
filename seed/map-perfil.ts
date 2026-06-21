import {
  extractH1Name,
  findSection,
  splitH2Sections,
  type Section,
} from "./parse-markdown";
import { PLATFORM_KEYS, type ProfilePlatform } from "../lib/ai/platforms";

// La fila de profiles que produce el mapeo. Los campos jsonb guardan el texto
// real del .md (no se inventa contenido); platforms se estructura para poder
// cruzarlo con el conocimiento del ecosistema.
export type ProfileSeed = {
  display_name: string;
  positioning: { quien_soy: string | null; declaracion: string | null };
  pillars: { text: string | null };
  audience: { text: string | null };
  voice: { text: string | null };
  tacit: { text: string | null };
  goals: { text: string | null };
  platforms: ProfilePlatform[];
  performance_patterns: unknown[];
  referents: string[];
  onboarding_completed: boolean;
};

function stripBold(value: string): string {
  return value.replace(/\*\*/g, "").trim();
}

function labelToKeys(label: string): ProfilePlatform["key"][] {
  const l = label.toLowerCase();
  const keys: ProfilePlatform["key"][] = [];
  if (l.includes("linkedin")) keys.push("linkedin");
  if (l.includes("youtube")) keys.push("youtube");
  if (l.includes("substack") || l.includes("newsletter")) keys.push("substack");
  if (l.includes("instagram")) keys.push("instagram");
  if (l.includes("tiktok")) keys.push("tiktok");
  if (/\bx\b/.test(l)) keys.push("x");
  return keys.filter((k) => (PLATFORM_KEYS as readonly string[]).includes(k));
}

// Parsea la tabla "Plataforma | Rol | Formato | Estado" a entradas estructuradas.
function parsePlatformsTable(body: string | null): ProfilePlatform[] {
  if (!body) return [];
  const platforms: ProfilePlatform[] = [];

  for (const line of body.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 4) continue;

    const [labelRaw, role, format, status] = cells;
    const label = stripBold(labelRaw);
    // Saltar cabecera y separador.
    if (/^plataforma$/i.test(label) || /^-+$/.test(label)) continue;

    for (const key of labelToKeys(label)) {
      platforms.push({
        key,
        label: stripBold(labelRaw),
        role: stripBold(role),
        format: stripBold(format),
        status: stripBold(status),
      });
    }
  }

  return platforms;
}

function parseReferents(body: string | null): string[] {
  if (!body) return [];
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim())
    .filter(Boolean);
}

// Mapea una instancia de perfil (p. ej. PERFIL_CARLOS.md) a una fila de profiles.
export function mapPerfil(md: string): ProfileSeed {
  const sections: Section[] = splitH2Sections(md);
  const text = (pattern: RegExp) => findSection(sections, pattern);

  return {
    display_name: extractH1Name(md) ?? "Usuario",
    positioning: {
      quien_soy: text(/qui[eé]n soy/i),
      declaracion: text(/posicionamiento/i),
    },
    pillars: { text: text(/pilares/i) },
    audience: { text: text(/audiencia/i) },
    voice: { text: text(/voz y tono/i) },
    tacit: { text: text(/datos t[aá]citos/i) },
    goals: { text: text(/objetivos/i) },
    platforms: parsePlatformsTable(text(/plataformas/i)),
    performance_patterns: [],
    referents: parseReferents(text(/referentes/i)),
    onboarding_completed: true,
  };
}
