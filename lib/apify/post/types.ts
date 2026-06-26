// Tipos compartidos para el sistema de scraping de posts individuales y perfiles
// vía Apify. Distinto de lib/apify/actors.ts (que es para scraping de perfiles propios).

export type SocialPlatform =
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "facebook";

export type UrlContentType =
  | "post"
  | "reel"
  | "video"
  | "profile"
  | "company"
  | "channel"
  | "page";

export type DetectedUrl = {
  platform: SocialPlatform;
  contentType: UrlContentType;
  handle?: string;
  label: string;        // "LinkedIn · Perfil personal"
  description: string;  // "Importaremos los 40 posts más recientes de @fulano..."
  limitedAccess?: boolean; // Facebook y redes con login restringido
};

export type NormalizedPost = {
  platform: SocialPlatform;
  url: string;
  author: {
    name: string;
    handle?: string;
    profileUrl?: string;
  };
  text: string;
  publishedAt?: string;
  stats: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  media: {
    type: "none" | "image" | "video" | "carousel";
    urls: string[];
    downloadedPath?: string;
  };
  transcript?: string;
  raw: object;
};

export type AdapterConfig = {
  actorId: string;
  input: Record<string, unknown>;
};

export interface PlatformAdapter {
  getConfig(url: string, contentType: UrlContentType): AdapterConfig;
  normalizeItem(raw: Record<string, unknown>, url: string): NormalizedPost;
}

export class ScrapePostError extends Error {
  constructor(
    public readonly platform: SocialPlatform | "unknown",
    public readonly reason: string
  ) {
    super(`[${platform}] ${reason}`);
    this.name = "ScrapePostError";
  }
}
