import type { PlatformAdapter, AdapterConfig, NormalizedPost, UrlContentType } from "../types";

export const youtubeAdapter: PlatformAdapter = {
  getConfig(url: string, contentType: UrlContentType): AdapterConfig {
    if (contentType === "video") {
      // epctex actor: descarga el vídeo y trae metadata
      return {
        actorId: "epctex/youtube-video-downloader",
        input: { startUrls: [url], quality: "720p", storageType: "apify" },
      };
    }
    // channel
    return {
      actorId: "h7LD7yBFaiycoRuU", // apify/youtube-scraper
      input: { startUrls: [{ url }], maxResults: 40, downloadSubtitles: false },
    };
  },

  normalizeItem(raw, url): NormalizedPost {
    const r = raw as Record<string, unknown>;

    const title = String(r.title ?? r.name ?? "");
    const description = String(r.description ?? r.text ?? "").slice(0, 800);
    const text = [title, description].filter(Boolean).join("\n\n");
    const publishedAt = String(r.uploadDate ?? r.date ?? r.publishedAt ?? "");

    const channelName = String(r.channelName ?? r.channel ?? r.author ?? "");
    const channelUrl = String(r.channelUrl ?? r.authorUrl ?? "");

    const views = Number(r.viewCount ?? r.views ?? 0);
    const likes = Number(r.likes ?? r.likeCount ?? 0);
    const comments = Number(r.commentCount ?? 0);

    const fileUrl = String(r.fileUrl ?? r.videoUrl ?? r.url ?? "");

    return {
      platform: "youtube",
      url: String(r.url ?? r.videoUrl ?? url),
      author: {
        name: channelName,
        profileUrl: channelUrl || undefined,
      },
      text,
      publishedAt: publishedAt || undefined,
      stats: { views, likes, comments },
      media: {
        type: "video",
        urls: fileUrl ? [fileUrl] : [],
        downloadedPath: fileUrl || undefined,
      },
      raw,
    };
  },
};
