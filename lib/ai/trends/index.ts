import { fetchTopTrends } from "@/lib/ai/trends/trendsmcp";
import {
  buildGrounding,
  type TrendGrounding,
  type TrendSourceConfig,
} from "@/lib/ai/trends/types";

export {
  parseSources,
  resolveTrendConfig,
  buildGrounding,
  type TrendSourceConfig,
  type TrendGrounding,
} from "@/lib/ai/trends/types";

// Punto de entrada: dado el config de fuentes, devuelve grounding para el Trend
// Analyst, o null si está desactivado / sin key / sin datos. Nunca lanza: el
// pipeline no puede morir por una fuente de tendencias.
export async function getTrendGrounding(
  config: TrendSourceConfig
): Promise<TrendGrounding | null> {
  if (!config.enabled) return null;
  if (config.sources.length === 0) return null;

  switch (config.provider) {
    case "trendsmcp": {
      if (!config.apiKey || !config.url) return null;
      const perSource = await fetchTopTrends({
        url: config.url,
        apiKey: config.apiKey,
        sources: config.sources,
      });
      return buildGrounding("trendsmcp", perSource);
    }
    case "none":
    default:
      return null;
  }
}
