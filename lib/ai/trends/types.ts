// Capa de "fuentes de tendencias" enchufable. Permite alimentar al Trend Analyst
// con datos REALES de tendencias de redes (no solo el conocimiento del modelo).
//
// Importante (arquitectura): Demiurgos es una webapp Next.js en Vercel, NO un
// cliente MCP como Claude Code/Desktop. Por eso no "instalamos un MCP": hablamos
// con un servidor de tendencias remoto por HTTP desde el backend. El proveedor por
// defecto es trendsmcp.ai (MCP remoto sobre HTTP, key Bearer, free tier).
//
// Todo es OPCIONAL y degrada con elegancia: si está desactivado, sin key o falla,
// el Trend Analyst sigue funcionando solo con su conocimiento (como hasta ahora).

export type TrendSourceConfig = {
  enabled: boolean;
  provider: string; // 'trendsmcp' | 'none'
  sources: string[]; // p.ej. ['tiktok','youtube','google search','reddit']
  apiKey?: string; // viene de env (TRENDS_API_KEY), no de la BD
  url?: string; // endpoint del MCP remoto (default trendsmcp)
};

export type TrendGrounding = {
  text: string; // bloque markdown para inyectar en el prompt del analista
  sourcesUsed: string[];
};

const MAX_SOURCES = 4;

// Parser puro (testeable): separa por comas, recorta y dedupe (sin distinguir
// mayúsculas para el dedupe) PERO preserva el texto original — los `type` de
// trendsmcp son sensibles a mayúsculas ('TikTok Trending Hashtags').
export function parseSources(csv: string | null | undefined): string[] {
  if (!csv) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of csv.split(",")) {
    const s = raw.trim();
    const key = s.toLowerCase();
    if (s && !seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
    if (out.length >= MAX_SOURCES) break;
  }
  return out;
}

// Da forma al bloque de grounding a partir de resultados crudos por fuente.
// Puro y testeable: no toca red.
export function buildGrounding(
  provider: string,
  perSource: { source: string; text: string }[]
): TrendGrounding | null {
  const usable = perSource.filter((p) => p.text.trim().length > 0);
  if (usable.length === 0) return null;
  const body = usable
    .map((p) => `## ${p.source}\n${p.text.trim()}`)
    .join("\n\n");
  const text = [
    `# DATOS DE TENDENCIAS EN TIEMPO REAL (fuente: ${provider})`,
    "Son datos frescos de las plataformas. Úsalos como evidencia y cita lo que",
    "veas aquí; NO inventes cifras que no estén en estos datos.",
    "",
    body,
  ].join("\n");
  return { text, sourcesUsed: usable.map((p) => p.source) };
}

// Resuelve la configuración de fuentes desde settings (BD) + env (secreto).
export function resolveTrendConfig(args: {
  enabled: boolean;
  provider: string;
  sourcesCsv: string;
}): TrendSourceConfig {
  return {
    enabled: args.enabled,
    provider: args.provider,
    sources: parseSources(args.sourcesCsv),
    apiKey: process.env.TRENDS_API_KEY,
    url: process.env.TRENDS_API_URL ?? "https://api.trendsmcp.ai/api",
  };
}
