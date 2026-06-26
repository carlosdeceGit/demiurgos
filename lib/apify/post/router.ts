// Detección de plataforma y tipo de contenido a partir de una URL.
// Solo string/URL manipulation — seguro de importar en componentes cliente.

import type { DetectedUrl, SocialPlatform, UrlContentType } from "./types";

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X / Twitter",
  facebook: "Facebook",
};

const CONTENT_TYPE_LABELS: Record<UrlContentType, string> = {
  post: "Post",
  reel: "Reel",
  video: "Vídeo",
  profile: "Perfil personal",
  company: "Empresa",
  channel: "Canal",
  page: "Página pública",
};

export function isProfileContentType(t: UrlContentType): boolean {
  return ["profile", "company", "channel", "page"].includes(t);
}

function makeLabel(p: SocialPlatform, t: UrlContentType): string {
  return `${PLATFORM_LABELS[p]} · ${CONTENT_TYPE_LABELS[t]}`;
}

function makeDescription(t: UrlContentType, handle?: string): string {
  const ref = handle ? `de ${handle} ` : "";
  if (isProfileContentType(t)) {
    return `Importaremos los 40 posts más recientes ${ref}como una única fuente analizada por el Director.`;
  }
  const hasMedia = t === "video" || t === "reel";
  return `Importaremos este ${CONTENT_TYPE_LABELS[t].toLowerCase()} con su texto, métricas${hasMedia ? " y transcripción (si disponible)" : ""}.`;
}

export function detectSocialUrl(rawUrl: string): DetectedUrl | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname;

  // ── LinkedIn ────────────────────────────────────────────────────────────
  if (host === "linkedin.com" || host.endsWith(".linkedin.com")) {
    const p: SocialPlatform = "linkedin";
    let t: UrlContentType;
    if (/\/posts\/|\/feed\/update\//i.test(path)) t = "post";
    else if (/\/company\//i.test(path)) t = "company";
    else if (/\/in\//i.test(path)) t = "profile";
    else return null;
    const seg = path.split("/").filter(Boolean);
    const handle = t === "profile" ? seg[1] : t === "company" ? seg[1] : undefined;
    return {
      platform: p, contentType: t,
      handle: handle ? `@${handle}` : undefined,
      label: makeLabel(p, t),
      description: makeDescription(t, handle ? `@${handle}` : undefined),
    };
  }

  // ── Instagram ───────────────────────────────────────────────────────────
  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    const p: SocialPlatform = "instagram";
    let t: UrlContentType;
    let handle: string | undefined;
    if (/^\/p\//i.test(path)) t = "post";
    else if (/^\/reel\//i.test(path)) t = "reel";
    else {
      t = "profile";
      const seg = path.split("/").filter(Boolean)[0];
      if (seg) handle = `@${seg}`;
    }
    return {
      platform: p, contentType: t, handle,
      label: makeLabel(p, t),
      description: makeDescription(t, handle),
    };
  }

  // ── TikTok ──────────────────────────────────────────────────────────────
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const p: SocialPlatform = "tiktok";
    const m = path.match(/^\/@([^/]+)/);
    if (!m) return null;
    const handle = `@${m[1]}`;
    const t: UrlContentType = /\/video\//i.test(path) ? "video" : "profile";
    return {
      platform: p, contentType: t, handle,
      label: makeLabel(p, t),
      description: makeDescription(t, handle),
    };
  }

  // ── YouTube ─────────────────────────────────────────────────────────────
  if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) {
    const p: SocialPlatform = "youtube";
    let t: UrlContentType;
    let handle: string | undefined;
    if (host === "youtu.be" || /\/watch\b/.test(path) || /\/shorts\//.test(path)) {
      t = "video";
    } else if (/^\/@/.test(path)) {
      t = "channel";
      handle = path.split("/").filter(Boolean)[0];
    } else if (/\/channel\/|\/c\/|\/user\//.test(path)) {
      t = "channel";
      handle = path.split("/").filter(Boolean)[1];
    } else {
      return null;
    }
    return {
      platform: p, contentType: t, handle,
      label: makeLabel(p, t),
      description: makeDescription(t, handle),
    };
  }

  // ── X / Twitter ─────────────────────────────────────────────────────────
  if (host === "x.com" || host === "twitter.com" || host.endsWith(".twitter.com")) {
    const p: SocialPlatform = "x";
    const parts = path.split("/").filter(Boolean);
    const t: UrlContentType = parts.length >= 3 && parts[1] === "status" ? "post" : "profile";
    const handle = parts[0] ? `@${parts[0]}` : undefined;
    return {
      platform: p, contentType: t, handle,
      label: makeLabel(p, t),
      description: makeDescription(t, handle),
    };
  }

  // ── Facebook ─────────────────────────────────────────────────────────────
  if (host === "facebook.com" || host.endsWith(".facebook.com")) {
    const p: SocialPlatform = "facebook";
    let t: UrlContentType;
    if (/\/posts\/|\/permalink\.php|\/photo|\/videos\//.test(path)) t = "post";
    else t = "page";
    const seg = path.split("/").filter(Boolean)[0];
    const handle = seg && seg !== "pages" && seg !== "permalink.php" ? seg : undefined;
    return {
      platform: p, contentType: t, handle,
      label: makeLabel(p, t),
      description: makeDescription(t, handle),
      limitedAccess: true,
    };
  }

  return null;
}
