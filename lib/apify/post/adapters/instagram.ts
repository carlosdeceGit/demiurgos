import type { PlatformAdapter, AdapterConfig, NormalizedPost, UrlContentType } from "../types";

export const instagramAdapter: PlatformAdapter = {
  getConfig(url: string, contentType: UrlContentType): AdapterConfig {
    const isPost = contentType === "post" || contentType === "reel";
    return {
      actorId: "shu8hvrXbJbY3Eb9W", // apify/instagram-scraper
      input: {
        directUrls: [url],
        resultsType: "posts",
        resultsLimit: isPost ? 1 : 40,
      },
    };
  },

  normalizeItem(raw, url): NormalizedPost {
    const r = raw as Record<string, unknown>;

    const text = String(r.caption ?? r.description ?? r.text ?? "");
    const publishedAt = String(r.timestamp ?? r.takenAt ?? "");
    const authorName = String(r.ownerFullName ?? r.ownerUsername ?? "");
    const authorHandle = String(r.ownerUsername ?? "");
    const authorUrl = authorHandle ? `https://instagram.com/${authorHandle}` : "";

    const likes = Number(r.likesCount ?? r.likeCount ?? 0);
    const comments = Number(r.commentsCount ?? r.commentCount ?? 0);

    // Carousel: childPosts[] or images[]
    const children = (r.childPosts ?? r.images ?? []) as Record<string, unknown>[];
    let mediaUrls: string[] = [];
    let mediaType: NormalizedPost["media"]["type"] = "none";

    if (children.length > 1) {
      mediaType = "carousel";
      mediaUrls = children
        .map((c) => String(c.displayUrl ?? c.url ?? c.imageUrl ?? ""))
        .filter(Boolean);
    } else {
      const videoUrl = String(r.videoUrl ?? "");
      const imageUrl = String(r.displayUrl ?? r.imageUrl ?? "");
      if (videoUrl) { mediaType = "video"; mediaUrls = [videoUrl]; }
      else if (imageUrl) { mediaType = "image"; mediaUrls = [imageUrl]; }
    }

    return {
      platform: "instagram",
      url: String(r.url ?? r.shortCode ? `https://instagram.com/p/${r.shortCode}` : url),
      author: {
        name: authorName,
        handle: authorHandle ? `@${authorHandle}` : undefined,
        profileUrl: authorUrl || undefined,
      },
      text,
      publishedAt: publishedAt || undefined,
      stats: { likes, comments },
      media: { type: mediaType, urls: mediaUrls },
      raw,
    };
  },
};
