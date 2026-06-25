import type { PlatformKey } from "@/lib/ai/platforms";
export type { PlatformKey };

// Actor IDs de Apify (públicos, probados para posts)
export const ACTOR_IDS: Partial<Record<PlatformKey, string>> = {
  linkedin: "2SyF0bVxmgGr8IVCZ",    // apify/linkedin-post-scraper
  instagram: "shu8hvrXbJbY3Eb9W",   // apify/instagram-scraper
  tiktok: "OtzYfK1ndEGdwWFKQ",      // apify/tiktok-scraper
  youtube: "h7LD7yBFaiycoRuU",      // apify/youtube-scraper
  x: "heLL6fUofdPgRXZie",           // apify/twitter-scraper
  // substack: web-crawler personalizado
};

// Actor genérico para Substack
export const SUBSTACK_ACTOR = "aYG0l9s7dbB7j3gbS"; // apify/website-content-crawler

export const MAX_POSTS = 20;

type ActorInput = Record<string, unknown>;

// Construye el input correcto para cada plataforma
export function buildInput(platform: PlatformKey, url: string): ActorInput {
  switch (platform) {
    case "linkedin":
      return { profileUrls: [url], maxResults: MAX_POSTS, scrapeType: "posts" };
    case "instagram":
      return { directUrls: [url], resultsType: "posts", resultsLimit: MAX_POSTS };
    case "tiktok":
      return {
        profiles: [url],
        resultsPerPage: MAX_POSTS,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      };
    case "youtube":
      return { startUrls: [{ url }], maxResults: MAX_POSTS, downloadSubtitles: false };
    case "x":
      return { startUrls: [{ url }], maxTweets: MAX_POSTS, addUserInfo: false };
    case "substack":
      return {
        startUrls: [{ url: url.replace(/\/$/, "") + "/archive" }],
        maxCrawlPages: 2,
        maxResults: MAX_POSTS,
      };
  }
}

// Estructura normalizada de un post extraído
export type ExtractedPost = {
  post_text: string;
  post_date: string;
  engagement: Record<string, number>;
  raw: Record<string, unknown>;
};

// Extrae un post individual de un item crudo de Apify, normalizado por plataforma
export function extractPost(
  platform: PlatformKey,
  item: Record<string, unknown>
): ExtractedPost {
  switch (platform) {
    case "linkedin":
      return {
        post_text: String(item.text ?? item.content ?? item.commentary ?? ""),
        post_date: String(item.postedAt ?? item.postedDate ?? ""),
        engagement: {
          likes: Number(item.numLikes ?? item.totalReactionCount ?? 0),
          comments: Number(item.numComments ?? 0),
          reposts: Number(item.numReposts ?? item.numShares ?? 0),
        },
        raw: item,
      };

    case "instagram":
      return {
        post_text: String(item.caption ?? item.description ?? ""),
        post_date: String(item.timestamp ?? ""),
        engagement: {
          likes: Number(item.likesCount ?? 0),
          comments: Number(item.commentsCount ?? 0),
        },
        raw: item,
      };

    case "tiktok":
      return {
        post_text: String(item.text ?? item.description ?? ""),
        post_date: String(item.createTime ?? ""),
        engagement: {
          plays: Number(item.playCount ?? 0),
          likes: Number(item.diggCount ?? item.likeCount ?? 0),
          comments: Number(item.commentCount ?? 0),
          shares: Number(item.shareCount ?? 0),
        },
        raw: item,
      };

    case "youtube":
      return {
        post_text: [
          String(item.title ?? ""),
          String(item.description ?? "").slice(0, 500),
        ]
          .filter(Boolean)
          .join("\n"),
        post_date: String(item.date ?? item.uploadDate ?? ""),
        engagement: {
          views: Number(item.viewCount ?? 0),
          likes: Number(item.likes ?? 0),
          comments: Number(item.commentCount ?? 0),
        },
        raw: item,
      };

    case "x":
      return {
        post_text: String(item.full_text ?? item.text ?? ""),
        post_date: String(item.created_at ?? ""),
        engagement: {
          likes: Number(item.favorite_count ?? item.likeCount ?? 0),
          retweets: Number(item.retweet_count ?? 0),
          replies: Number(item.reply_count ?? 0),
        },
        raw: item,
      };

    case "substack":
      return {
        post_text: [
          String(item.title ?? ""),
          String(item.text ?? item.markdown ?? "").slice(0, 800),
        ]
          .filter(Boolean)
          .join("\n"),
        post_date: String(item.publishedAt ?? item.date ?? ""),
        engagement: {},
        raw: item,
      };
  }
}
