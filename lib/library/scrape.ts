// Utilidades de scraping para la ruta /api/library/scrape-url.
// Detecta la plataforma, extrae metadatos estructurados (JSON-LD, og:tags)
// y produce un Markdown limpio con cabecera informativa.

import { cleanMarkdown, deriveTitle, htmlToMarkdown } from "./convert";

// ── Tipos ──────────────────────────────────────────────────────

export type PlatformType =
  | "youtube"
  | "linkedin"
  | "tiktok"
  | "instagram"
  | "substack"
  | "twitter"
  | "web";

export type ScrapedResult = {
  title: string;
  markdown: string;
  platform: PlatformType;
  domain: string;
};

type SocialMeta = {
  author?: string;
  publishedDate?: string;
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
  shareCount?: string;
  followerCount?: string;
  duration?: string;
  description?: string;
};

// ── Detección de plataforma ────────────────────────────────────

export function detectPlatform(url: URL): PlatformType {
  const h = url.hostname.toLowerCase().replace(/^www\./, "");
  if (h === "youtube.com" || h === "youtu.be" || h.endsWith(".youtube.com"))
    return "youtube";
  if (h === "linkedin.com" || h.endsWith(".linkedin.com")) return "linkedin";
  if (h === "tiktok.com" || h.endsWith(".tiktok.com")) return "tiktok";
  if (h === "instagram.com" || h.endsWith(".instagram.com")) return "instagram";
  if (h === "substack.com" || h.endsWith(".substack.com")) return "substack";
  if (h === "twitter.com" || h === "x.com" || h.endsWith(".twitter.com"))
    return "twitter";
  return "web";
}

// ── Extracción de metadatos ────────────────────────────────────

function extractOGTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  // og:property
  const ogRe =
    /<meta[^>]+property=["']og:([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = ogRe.exec(html)) !== null) tags[m[1]] = decode(m[2]);
  // og:content first (some sites swap attr order)
  const ogRev =
    /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:([^"']+)["'][^>]*\/?>/gi;
  while ((m = ogRev.exec(html)) !== null)
    if (!tags[m[2]]) tags[m[2]] = decode(m[1]);
  return tags;
}

function extractMetaName(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  const re =
    /<meta[^>]+(?:name|itemprop)=["']([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) tags[m[1].toLowerCase()] = decode(m[2]);
  return tags;
}

function extractJsonLD(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (Array.isArray(parsed))
        results.push(...(parsed as Record<string, unknown>[]));
      else results.push(parsed as Record<string, unknown>);
    } catch {
      // JSON malformed — ignorar
    }
  }
  return results;
}

function extractPageTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? decode(m[1].trim().replace(/\s+/g, " ")) : "";
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function fmtNum(n: string | number | undefined): string | undefined {
  if (n === undefined || n === null || n === "") return undefined;
  const num = Number(String(n).replace(/[^\d]/g, ""));
  if (isNaN(num)) return undefined;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)} K`;
  return String(num);
}

function fmtDuration(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return undefined;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const sec = Number(m[3] ?? 0);
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  parts.push(`${String(min).padStart(h ? 2 : 1, "0")}m`);
  if (!h) parts.push(`${String(sec).padStart(2, "0")}s`);
  return parts.join(" ");
}

// ── Extracción por plataforma ──────────────────────────────────

function extractYouTubeMeta(html: string): {
  title: string;
  meta: SocialMeta;
} {
  const ld = extractJsonLD(html);
  const og = extractOGTags(html);

  const videoLd = ld.find(
    (o) =>
      (o["@type"] as string)?.includes("VideoObject") ||
      (o["@type"] as string)?.includes("Video")
  );

  let viewCount: string | undefined;
  let likeCount: string | undefined;
  let duration: string | undefined;
  let author: string | undefined;
  let publishedDate: string | undefined;
  let description: string | undefined;

  if (videoLd) {
    const stats = videoLd.interactionStatistic as
      | { interactionType: string; userInteractionCount?: number }[]
      | undefined;
    if (Array.isArray(stats)) {
      for (const s of stats) {
        const t = String(s.interactionType ?? "");
        if (t.includes("WatchAction") || t.includes("Watch"))
          viewCount = fmtNum(s.userInteractionCount);
        if (t.includes("LikeAction") || t.includes("Like"))
          likeCount = fmtNum(s.userInteractionCount);
      }
    }
    duration = fmtDuration(videoLd.duration as string | undefined);
    const auth = videoLd.author as { name?: string } | string | undefined;
    author =
      typeof auth === "object" ? (auth?.name ?? undefined) : (auth ?? undefined);
    publishedDate = videoLd.uploadDate as string | undefined;
    if (publishedDate) publishedDate = publishedDate.split("T")[0];
    description =
      typeof videoLd.description === "string" ? videoLd.description : undefined;
  }

  const title =
    (videoLd?.name as string | undefined) ||
    og.title ||
    extractPageTitle(html).replace(" - YouTube", "").trim();

  if (!description) description = og.description;

  return {
    title,
    meta: {
      author,
      publishedDate,
      viewCount,
      likeCount,
      duration,
      description,
    },
  };
}

function extractSubstackMeta(html: string): {
  title: string;
  meta: SocialMeta;
} {
  const ld = extractJsonLD(html);
  const og = extractOGTags(html);
  const mn = extractMetaName(html);

  const article = ld.find(
    (o) => (o["@type"] as string) === "Article" || (o["@type"] as string) === "NewsArticle"
  );

  const title =
    (article?.headline as string | undefined) ||
    og.title ||
    extractPageTitle(html);

  const author =
    (
      (article?.author as { name?: string } | undefined)?.name
    ) ||
    mn["author"] ||
    og["article:author"];

  const publishedDate =
    (article?.datePublished as string | undefined)?.split("T")[0] ||
    mn["article:published_time"]?.split("T")[0] ||
    og["article:published_time"]?.split("T")[0];

  return { title, meta: { author, publishedDate, description: og.description } };
}

function extractGenericMeta(html: string): {
  title: string;
  meta: SocialMeta;
} {
  const ld = extractJsonLD(html);
  const og = extractOGTags(html);
  const mn = extractMetaName(html);

  const article = ld.find(
    (o) =>
      typeof (o["@type"] as string) === "string" &&
      ["Article", "NewsArticle", "BlogPosting", "WebPage"].includes(
        o["@type"] as string
      )
  );

  const title =
    (article?.headline as string | undefined) ||
    og.title ||
    extractPageTitle(html);

  const author =
    ((article?.author as { name?: string } | undefined)?.name) ||
    mn["author"] ||
    mn["article:author"];

  const publishedDate =
    (article?.datePublished as string | undefined)?.split("T")[0] ||
    mn["article:published_time"]?.split("T")[0] ||
    og["article:published_time"]?.split("T")[0];

  const description = og.description || mn["description"];

  return { title, meta: { author, publishedDate, description } };
}

function extractLinkedInMeta(html: string): {
  title: string;
  meta: SocialMeta;
} {
  const og = extractOGTags(html);
  const ld = extractJsonLD(html);

  const personLd = ld.find((o) => (o["@type"] as string) === "Person");
  const author =
    (personLd?.name as string | undefined) || og["title"]?.split(" | ")[1];
  const description = og.description;

  const title = og.title || extractPageTitle(html).replace(" | LinkedIn", "").trim();
  return { title, meta: { author, description } };
}

function extractTikTokMeta(html: string): {
  title: string;
  meta: SocialMeta;
} {
  const og = extractOGTags(html);
  const ld = extractJsonLD(html);

  const videoLd = ld.find((o) =>
    ["VideoObject", "SocialMediaPosting"].includes(o["@type"] as string)
  );

  const stats = videoLd?.interactionStatistic as
    | { interactionType: string; userInteractionCount?: number }[]
    | undefined;
  let viewCount: string | undefined;
  let likeCount: string | undefined;
  let commentCount: string | undefined;
  if (Array.isArray(stats)) {
    for (const s of stats) {
      const t = String(s.interactionType ?? "");
      if (t.includes("Watch")) viewCount = fmtNum(s.userInteractionCount);
      if (t.includes("Like")) likeCount = fmtNum(s.userInteractionCount);
      if (t.includes("Comment")) commentCount = fmtNum(s.userInteractionCount);
    }
  }

  const author =
    (videoLd?.author as { name?: string } | undefined)?.name || og["video:tag"];
  const title = og.title || extractPageTitle(html).replace(" | TikTok", "").trim();

  return { title, meta: { author, viewCount, likeCount, commentCount, description: og.description } };
}

// ── Ensamblado del Markdown ────────────────────────────────────

const PLATFORM_LABELS: Record<PlatformType, string> = {
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  instagram: "Instagram",
  substack: "Substack",
  twitter: "X / Twitter",
  web: "Web",
};

const PLATFORM_NOTES: Partial<Record<PlatformType, string>> = {
  youtube:
    "> ℹ️ *Solo metadata extraída. Para la transcripción: descárgala de YouTube Studio (.txt) y súbela como archivo en tu [Biblioteca](/library).*",
  instagram:
    "> ⚠️ *Instagram requiere inicio de sesión para el contenido completo. Copia el texto del post y pégalo en el [chat con el Director](/chat) o súbelo como archivo.*",
  twitter:
    "> ⚠️ *X / Twitter limita el acceso sin login. Si el tweet es público, parte del texto puede haberse extraído; de lo contrario, cópialo manualmente.*",
  linkedin:
    "> ℹ️ *LinkedIn limita el contenido sin sesión. Para posts o perfiles privados, copia el texto y pégalo en el [Director](/chat) o súbelo como archivo.*",
};

function buildMarkdown(
  title: string,
  meta: SocialMeta,
  platform: PlatformType,
  rawUrl: string,
  bodyMd: string
): string {
  const lines: string[] = [`# ${title}`, ""];

  // Línea de metadatos
  const metaLine: string[] = [`**${PLATFORM_LABELS[platform]}**`];
  if (meta.author) metaLine.push(meta.author);
  if (meta.publishedDate) metaLine.push(meta.publishedDate);
  lines.push(`> ${metaLine.join(" · ")}`);

  // Línea de métricas
  const metrics: string[] = [];
  if (meta.viewCount) metrics.push(`${meta.viewCount} vistas`);
  if (meta.likeCount) metrics.push(`${meta.likeCount} likes`);
  if (meta.commentCount) metrics.push(`${meta.commentCount} comentarios`);
  if (meta.shareCount) metrics.push(`${meta.shareCount} compartidos`);
  if (meta.followerCount) metrics.push(`${meta.followerCount} seguidores`);
  if (meta.duration) metrics.push(meta.duration);
  if (metrics.length > 0) lines.push(`> ${metrics.join(" · ")}`);

  // URL fuente
  lines.push(`> ${rawUrl}`);

  // Nota de plataforma
  const note = PLATFORM_NOTES[platform];
  if (note) {
    lines.push("");
    lines.push(note);
  }

  // Descripción (si no hay body, usamos la descripción como contenido)
  if (bodyMd.length < 100 && meta.description) {
    lines.push("");
    lines.push("## Descripción");
    lines.push(meta.description);
  } else if (bodyMd.length > 0) {
    lines.push("");
    lines.push(bodyMd);
  }

  return cleanMarkdown(lines.join("\n"));
}

// ── Función principal ──────────────────────────────────────────

export function scrapeHtml(html: string, url: URL, rawUrl: string): ScrapedResult {
  const platform = detectPlatform(url);
  const domain = url.hostname.replace(/^www\./, "");

  // Extraer metadata específica de la plataforma
  let title = "";
  let meta: SocialMeta = {};

  switch (platform) {
    case "youtube":
      ({ title, meta } = extractYouTubeMeta(html));
      break;
    case "substack":
      ({ title, meta } = extractSubstackMeta(html));
      break;
    case "linkedin":
      ({ title, meta } = extractLinkedInMeta(html));
      break;
    case "tiktok":
      ({ title, meta } = extractTikTokMeta(html));
      break;
    default:
      ({ title, meta } = extractGenericMeta(html));
  }

  // Convertir HTML a Markdown para el cuerpo
  const rawMd = htmlToMarkdown(html);
  const bodyMd = cleanMarkdown(rawMd);

  // Para plataformas con login, el body suele ser poco útil — usamos solo metadata
  const useBodyMd =
    platform !== "instagram" && platform !== "twitter" ? bodyMd : "";

  // Construir el Markdown final con cabecera
  const finalTitle =
    title || deriveTitle(bodyMd, `${PLATFORM_LABELS[platform]} · ${domain}`);
  const markdown = buildMarkdown(finalTitle, meta, platform, rawUrl, useBodyMd);

  return { title: finalTitle, markdown, platform, domain };
}
