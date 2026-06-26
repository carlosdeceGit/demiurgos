import type { PlatformAdapter, AdapterConfig, NormalizedPost, UrlContentType } from "../types";

export const linkedinAdapter: PlatformAdapter = {
  getConfig(url: string, contentType: UrlContentType): AdapterConfig {
    if (contentType === "post") {
      return {
        actorId: "apimaestro/linkedin-post-detail",
        input: { post_urls: [url] },
      };
    }
    // profile / company
    return {
      actorId: "2SyF0bVxmgGr8IVCZ", // apify/linkedin-post-scraper
      input: {
        profileUrls: [url],
        maxResults: 40,
        scrapeType: "posts",
      },
    };
  },

  normalizeItem(raw, url): NormalizedPost {
    const r = raw as Record<string, unknown>;

    // Single post fields (apimaestro/linkedin-post-detail)
    const text = String(r.text ?? r.content ?? r.commentary ?? r.description ?? "");
    const publishedAt = String(r.postedAt ?? r.postedDate ?? r.date ?? "");

    const authorRaw = r.author as Record<string, unknown> | undefined;
    const authorName =
      String(authorRaw?.name ?? r.authorName ?? r.name ?? "");
    const authorHandle =
      String(authorRaw?.headline ?? r.authorHeadline ?? "");
    const authorUrl =
      String(authorRaw?.profileUrl ?? r.authorUrl ?? r.profileUrl ?? "");

    const likes = Number(
      r.reactionCount ?? r.numLikes ?? r.totalReactionCount ?? 0
    );
    const comments = Number(r.commentCount ?? r.numComments ?? 0);
    const shares = Number(r.repostCount ?? r.numReposts ?? r.numShares ?? 0);

    const mediaArr = (r.media ?? r.images ?? []) as Record<string, unknown>[];
    const mediaUrls = mediaArr.map((m) => String(m.url ?? m.src ?? "")).filter(Boolean);
    const mediaType =
      mediaUrls.length > 1
        ? "carousel"
        : mediaUrls.length === 1
          ? "image"
          : "none";

    return {
      platform: "linkedin",
      url: String(r.url ?? r.postUrl ?? url),
      author: { name: authorName, handle: authorHandle || undefined, profileUrl: authorUrl || undefined },
      text,
      publishedAt: publishedAt || undefined,
      stats: { likes, comments, shares },
      media: { type: mediaType as NormalizedPost["media"]["type"], urls: mediaUrls },
      raw,
    };
  },
};
