import type { SocialPlatform, PlatformAdapter } from "../types";
import { linkedinAdapter } from "./linkedin";
import { instagramAdapter } from "./instagram";
import { tiktokAdapter } from "./tiktok";
import { youtubeAdapter } from "./youtube";
import { twitterAdapter } from "./twitter";
import { facebookAdapter } from "./facebook";

export const ADAPTERS: Record<SocialPlatform, PlatformAdapter> = {
  linkedin: linkedinAdapter,
  instagram: instagramAdapter,
  tiktok: tiktokAdapter,
  youtube: youtubeAdapter,
  x: twitterAdapter,
  facebook: facebookAdapter,
};
