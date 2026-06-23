// Adaptador de trendsmcp.ai por su API REST simple (verificada): POST a /api
// con cabecera Bearer. Usamos get_top_trends (lo que está de moda AHORA en cada
// red), que es justo lo que necesita el Trend Analyst para "la semana del nicho".
//
// Forma de respuesta observada:
//   { statusCode, body: "{...\"data\": [[1,\"justgolive\"],[2,\"...\"]]}" }
// (o el objeto directamente). Parseamos ambas de forma defensiva.
//
// Las `sources` son los `type` EXACTOS de trendsmcp, p. ej.:
//   'TikTok Trending Hashtags', 'YouTube Trending', 'Google Trends',
//   'Reddit Hot Posts', 'X (Twitter) Trending', 'Google News Top News'.

const TIMEOUT_MS = 12_000;
const ROWS_PER_SOURCE = 10;

type AnyRecord = Record<string, unknown>;

// Extrae el objeto interno (la API puede envolver en {statusCode, body:"json"}).
function unwrap(json: unknown): AnyRecord | null {
  if (!json || typeof json !== "object") return null;
  const obj = json as AnyRecord;
  if (typeof obj.body === "string") {
    try {
      return JSON.parse(obj.body) as AnyRecord;
    } catch {
      return null;
    }
  }
  return obj;
}

// Convierte data ([[1,"x"],[2,"y"]] o [{...}]) en texto legible para el modelo.
function formatRows(inner: AnyRecord | null): string {
  if (!inner) return "";
  const data = inner.data;
  if (!Array.isArray(data)) return inner ? JSON.stringify(inner) : "";
  return data
    .map((row) => {
      if (Array.isArray(row)) {
        const [rank, ...rest] = row;
        return `${rank}. ${rest.map((r) => String(r)).join(" · ")}`;
      }
      if (row && typeof row === "object") return JSON.stringify(row);
      return String(row);
    })
    .filter(Boolean)
    .join("\n");
}

export async function fetchTopTrends(args: {
  url: string;
  apiKey: string;
  sources: string[];
}): Promise<{ source: string; text: string }[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const results: { source: string; text: string }[] = [];
    for (const source of args.sources) {
      try {
        const res = await fetch(args.url, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${args.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ type: source, limit: ROWS_PER_SOURCE }),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        results.push({
          source,
          text: formatRows(unwrap(await res.json())),
        });
      } catch (err) {
        results.push({
          source,
          text: `(sin datos: ${err instanceof Error ? err.message : String(err)})`,
        });
      }
    }
    return results;
  } finally {
    clearTimeout(timer);
  }
}
