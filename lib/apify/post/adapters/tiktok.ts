import type { PlatformAdapter, AdapterConfig, NormalizedPost, UrlContentType } from "../types";

export const tiktokAdapter: PlatformAdapter = {
  getConfig(url: string, contentType: UrlContentType): AdapterConfig {
    const isPost = contentType === "video";
    if (isPost) {
      return {
        actorId: "clockworks/tiktok-scraper",
        input: {
          postURLs: [url],
          resultsPerPage: 1,
          shouldDownloadVideos: true,
          downloadSubtitlesOptions: "TRANSCRIBE_ALL_VIDEOS",
        },
      };
    }
    // profile
    return {
      actorId: "OtzYfK1ndEGdwWFKQ", // apify/tiktok-scraper
      input: {
        profiles: [url],
        resultsPerPage: 40,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      },
    };
  },

  normalizeItem(raw, url): NormalizedPost {
    const r = raw as Record<string, unknown>;

    const text = String(r.text ?? r.description ?? r.title ?? "");
    const publishedAt = r.createTime
      ? new Date(Number(r.createTime) * 1000).toISOString()
      : String(r.createTimeISO ?? "");

    const authorMeta = r.authorMeta as Record<string, unknown> | undefined;
    const authorName = String(authorMeta?.name ?? r.authorName ?? "");
    const authorHandle = String(authorMeta?.id ?? authorMeta?.name ?? "");
    const authorUrl = authorHandle ? `https://tiktok.com/@${authorHandle}` : "";

    const views = Number(r.playCount ?? r.viewCount ?? 0);
    const likes = Number(r.diggCount ?? r.likeCount ?? 0);
    const comments = Number(r.commentCount ?? 0);
    const shares = Number(r.shareCount ?? 0);

    // Transcript from subtitles (clockworks actor)
    let transcript: string | undefined;
    const subs = r.subtitles as Record<string, unknown>[] | undefined;
    if (Array.isArray(subs) && subs.length > 0) {
      // subtitles is typically an array of {text, start, end} or raw text
      transcript = subs
        .map((s) => String(s.text ?? s.content ?? s ?? ""))
        .filter(Boolean)
        .join(" ");
    } else if (typeof r.transcript === "string" && r.transcript) {
      transcript = r.transcript;
    }

    const videoUrl = String(r.videoUrl ?? r.downloadUrl ?? "");
    const coverUrl = String(r.coverImageUrl ?? r.webVideoUrl ?? "");

    return {
      platform: "tiktok",
      url: String(r.webVideoUrl ?? r.videoUrl ?? url),
      author: {
        name: authorName,
        handle: authorHandle ? `@${authorHandle}` : undefined,
        profileUrl: authorUrl || undefined,
      },
      text,
      publishedAt: publishedAt || undefined,
      stats: { views, likes, comments, shares },
      media: {
        type: "video",
        urls: [videoUrl, coverUrl].filter(Boolean),
      },
      transcript,
      raw,
    };
  },
};
