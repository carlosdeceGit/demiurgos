import { runSync } from "@/lib/apify/client";
import { detectSocialUrl, isProfileContentType } from "./router";
import { ADAPTERS } from "./adapters";
import { ScrapePostError, type NormalizedPost, type DetectedUrl } from "./types";

export type ScrapeResult =
  | { kind: "post"; post: NormalizedPost; detected: DetectedUrl }
  | { kind: "profile"; posts: NormalizedPost[]; detected: DetectedUrl };

export async function scrapeSource(rawUrl: string): Promise<ScrapeResult> {
  const detected = detectSocialUrl(rawUrl);
  if (!detected) {
    throw new ScrapePostError("unknown", "URL no reconocida como red social soportada");
  }

  const adapter = ADAPTERS[detected.platform];
  const { actorId, input } = adapter.getConfig(rawUrl, detected.contentType);

  let items: Record<string, unknown>[];
  try {
    items = await runSync<Record<string, unknown>>(actorId, input, 90);
  } catch (err) {
    throw new ScrapePostError(
      detected.platform,
      `Error al llamar a Apify: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (items.length === 0) {
    throw new ScrapePostError(
      detected.platform,
      "El actor no devolvió resultados. El contenido puede ser privado, requerir login o haber sido eliminado."
    );
  }

  if (isProfileContentType(detected.contentType)) {
    const posts = items.map((item) => adapter.normalizeItem(item, rawUrl));
    return { kind: "profile", posts, detected };
  }

  const post = adapter.normalizeItem(items[0], rawUrl);
  return { kind: "post", post, detected };
}
