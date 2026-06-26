import type { PlatformAdapter, AdapterConfig, NormalizedPost, UrlContentType } from "../types";

// Acceso muy limitado sin sesión. Solo funciona para páginas públicas.
export const facebookAdapter: PlatformAdapter = {
  getConfig(url: string, _contentType: UrlContentType): AdapterConfig {
    return {
      actorId: "apify/facebook-pages-scraper",
      input: {
        startUrls: [{ url }],
        maxPosts: 40,
        maxPostComments: 0,
      },
    };
  },

  normalizeItem(raw, url): NormalizedPost {
    const r = raw as Record<string, unknown>;

    const text = String(r.text ?? r.message ?? r.story ?? "");
    const publishedAt = String(r.time ?? r.date ?? r.timestamp ?? "");

    const pageName = String(r.pageName ?? r.name ?? "");
    const pageUrl = String(r.pageUrl ?? r.url ?? url);

    const likes = Number(r.likes ?? r.reactionsCount ?? 0);
    const comments = Number(r.comments ?? r.commentsCount ?? 0);
    const shares = Number(r.shares ?? r.sharesCount ?? 0);

    const imageArr = (r.images ?? r.media ?? []) as Record<string, unknown>[];
    const mediaUrls = imageArr.map((m) => String(m.image ?? m.url ?? m.src ?? "")).filter(Boolean);
    const mediaType: NormalizedPost["media"]["type"] =
      mediaUrls.length > 1 ? "carousel" : mediaUrls.length === 1 ? "image" : "none";

    return {
      platform: "facebook",
      url: String(r.postUrl ?? r.url ?? url),
      author: { name: pageName, profileUrl: pageUrl },
      text,
      publishedAt: publishedAt || undefined,
      stats: { likes, comments, shares },
      media: { type: mediaType, urls: mediaUrls },
      raw,
    };
  },
};
