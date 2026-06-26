import type { PlatformAdapter, AdapterConfig, NormalizedPost, UrlContentType } from "../types";

export const twitterAdapter: PlatformAdapter = {
  getConfig(url: string, contentType: UrlContentType): AdapterConfig {
    if (contentType === "post") {
      return {
        actorId: "apidojo/tweet-scraper",
        input: { startUrls: [url], maxItems: 1 },
      };
    }
    // profile
    return {
      actorId: "heLL6fUofdPgRXZie", // apify/twitter-scraper
      input: { startUrls: [{ url }], maxTweets: 40, addUserInfo: false },
    };
  },

  normalizeItem(raw, url): NormalizedPost {
    const r = raw as Record<string, unknown>;

    const text = String(r.full_text ?? r.text ?? "");
    const publishedAt = String(r.created_at ?? r.createdAt ?? "");

    const user = r.user as Record<string, unknown> | undefined;
    const authorName = String(user?.name ?? r.authorName ?? r.name ?? "");
    const authorHandle = String(user?.screen_name ?? r.screenName ?? r.username ?? "");
    const authorUrl = authorHandle ? `https://x.com/${authorHandle}` : "";

    const likes = Number(r.favorite_count ?? r.likeCount ?? 0);
    const comments = Number(r.reply_count ?? r.replyCount ?? 0);
    const shares = Number(r.retweet_count ?? r.retweetCount ?? 0);

    // Media: puede ser HLS m3u8 o mp4 directo
    const mediaArr = (r.media ?? r.extended_entities?.media ?? []) as Record<string, unknown>[];
    const mediaUrls: string[] = [];
    let mediaType: NormalizedPost["media"]["type"] = "none";

    for (const m of mediaArr) {
      const mType = String(m.type ?? "");
      if (mType === "video" || mType === "animated_gif") {
        mediaType = "video";
        // Preferir mp4 sobre m3u8 si hay variantes
        const variants = (m.video_info as Record<string, unknown>)?.variants as Record<string, unknown>[] | undefined;
        if (Array.isArray(variants)) {
          const mp4 = variants
            .filter((v) => String(v.content_type ?? "").includes("mp4"))
            .sort((a, b) => Number(b.bitrate ?? 0) - Number(a.bitrate ?? 0))[0];
          const chosen = mp4 ?? variants[0];
          if (chosen?.url) mediaUrls.push(String(chosen.url));
        } else if (m.media_url_https) {
          mediaUrls.push(String(m.media_url_https));
        }
      } else if (mType === "photo") {
        if (mediaType === "none") mediaType = "image";
        else if (mediaType === "image") mediaType = "carousel";
        if (m.media_url_https) mediaUrls.push(String(m.media_url_https));
      }
    }

    return {
      platform: "x",
      url: String(r.url ?? url),
      author: {
        name: authorName,
        handle: authorHandle ? `@${authorHandle}` : undefined,
        profileUrl: authorUrl || undefined,
      },
      text,
      publishedAt: publishedAt || undefined,
      stats: { likes, comments, shares },
      media: { type: mediaType, urls: mediaUrls },
      raw,
    };
  },
};
