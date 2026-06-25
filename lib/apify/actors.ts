import type { PlatformKey } from "@/lib/ai/platforms";
export type { PlatformKey };

// Actor IDs de Apify (públicos, probados para posts)
export const ACTOR_IDS: Partial<Record<PlatformKey, string>> = {
  linkedin: "2SyF0bVxmgGr8IVCZ",    // apify/linkedin-post-scraper
  instagram: "shu8hvrXbJbY3Eb9W",   // apify/instagram-scraper
  tiktok: "OtzYfK1ndEGdwWFKQ",      // apify/tiktok-scraper
  youtube: "h7LD7yBFaiycoRuU",      // apify/youtube-scraper
  x: "heLL6fUofdPgRXZie",           // apify/twitter-scraper
  // substack: web-crawler personalizado, ver buildInput
};

export const MAX_POSTS = 20;

type ActorInput = Record<string, unknown>;

// Construye el input correcto para cada plataforma
export function buildInput(platform: PlatformKey, url: string): ActorInput {
  switch (platform) {
    case "linkedin":
      return {
        profileUrls: [url],
        maxResults: MAX_POSTS,
        scrapeType: "posts",
      };

    case "instagram":
      return {
        directUrls: [url],
        resultsType: "posts",
        resultsLimit: MAX_POSTS,
      };

    case "tiktok":
      return {
        profiles: [url],
        resultsPerPage: MAX_POSTS,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      };

    case "youtube":
      return {
        startUrls: [{ url }],
        maxResults: MAX_POSTS,
        downloadSubtitles: false,
        saveSubsToKV: false,
      };

    case "x":
      return {
        startUrls: [{ url }],
        maxTweets: MAX_POSTS,
        addUserInfo: false,
      };

    case "substack":
      // Substack no tiene actor dedicado; usamos web-scraper genérico
      return {
        startUrls: [{ url: url.replace(/\/$/, "") + "/archive" }],
        maxCrawlPages: 2,
        maxResults: MAX_POSTS,
      };
  }
}

// Actor ID para substack (web-content-crawler genérico)
export const SUBSTACK_ACTOR = "aYG0l9s7dbB7j3gbS"; // apify/website-content-crawler

// Formatea los items scrapeados en texto legible para el signal
export function formatPosts(
  platform: PlatformKey,
  items: Record<string, unknown>[]
): string {
  const lines: string[] = [`[${platform.toUpperCase()} — últimos posts]`];

  for (const item of items.slice(0, MAX_POSTS)) {
    switch (platform) {
      case "linkedin": {
        const text = item.text ?? item.content ?? item.commentary;
        const date = item.postedAt ?? item.postedDate ?? "";
        const reactions = item.numLikes ?? item.totalReactionCount ?? 0;
        if (text) lines.push(`• (${reactions} reacciones, ${date}) ${text}`);
        break;
      }
      case "instagram": {
        const caption = item.caption ?? item.description ?? "";
        const likes = item.likesCount ?? 0;
        const date = item.timestamp ?? "";
        if (caption) lines.push(`• (${likes} likes, ${date}) ${caption}`);
        break;
      }
      case "tiktok": {
        const desc = item.text ?? item.description ?? "";
        const plays = item.playCount ?? 0;
        const date = item.createTime ?? "";
        if (desc) lines.push(`• (${plays} plays, ${date}) ${desc}`);
        break;
      }
      case "youtube": {
        const title = item.title ?? "";
        const desc = item.description ?? "";
        const views = item.viewCount ?? 0;
        if (title) lines.push(`• (${views} views) ${title}: ${String(desc).slice(0, 200)}`);
        break;
      }
      case "x": {
        const text = item.full_text ?? item.text ?? "";
        const likes = item.favorite_count ?? item.likeCount ?? 0;
        const date = item.created_at ?? "";
        if (text) lines.push(`• (${likes} likes, ${date}) ${text}`);
        break;
      }
      case "substack": {
        const title = item.title ?? "";
        const text = item.text ?? item.markdown ?? "";
        if (title) lines.push(`• ${title}: ${String(text).slice(0, 300)}`);
        break;
      }
    }
  }

  return lines.join("\n");
}
