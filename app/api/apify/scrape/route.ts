// POST /api/apify/scrape
// Lanza runs de Apify para las plataformas activas con URL del usuario.
// El resultado llega al webhook /api/apify/webhook cuando Apify termina.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { startRun, type RunOptions } from "@/lib/apify/client";
import {
  ACTOR_IDS,
  SUBSTACK_ACTOR,
  buildInput,
  type PlatformKey,
} from "@/lib/apify/actors";
import { PLATFORM_KEYS } from "@/lib/ai/platforms";

function appUrl(): string {
  const u = process.env.APP_URL ?? process.env.VERCEL_URL;
  if (!u) throw new Error("APP_URL no configurado");
  return u.startsWith("http") ? u : `https://${u}`;
}

type PlatformRow = {
  key?: PlatformKey;
  platform?: PlatformKey;
  status?: string;
  url?: string;
  reference_accounts?: string | string[];
};

function normalizeKey(p: PlatformRow): PlatformKey | null {
  const k = p.key ?? p.platform;
  if (k && (PLATFORM_KEYS as readonly string[]).includes(k)) return k as PlatformKey;
  return null;
}

function toUrls(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : raw.split("\n");
  return arr.map((u) => u.trim()).filter(Boolean);
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("platforms")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const platforms: PlatformRow[] = Array.isArray(profile.platforms)
    ? (profile.platforms as PlatformRow[])
    : [];

  const webhookBase = `${appUrl()}/api/apify/webhook`;
  const launched: string[] = [];
  const errors: string[] = [];

  for (const p of platforms) {
    const key = normalizeKey(p);
    if (!key) continue;
    if (p.status !== "activo" && p.status !== "active") continue;

    const actorId = key === "substack" ? SUBSTACK_ACTOR : (ACTOR_IDS as Record<string, string>)[key];
    if (!actorId) continue;

    // 1. Perfil propio
    if (p.url?.trim()) {
      try {
        const opts: RunOptions = {
          actorId,
          input: buildInput(key, p.url.trim()),
          webhookUrl: webhookBase,
          webhookPayload: {
            userId: user.id,
            platform: key,
            target: "own",
          },
        };
        await startRun(opts);
        launched.push(`${key}:own`);
      } catch (e) {
        errors.push(`${key}:own → ${String(e)}`);
      }
    }

    // 2. Perfiles de referencia
    for (const refUrl of toUrls(p.reference_accounts)) {
      try {
        const opts: RunOptions = {
          actorId,
          input: buildInput(key, refUrl),
          webhookUrl: webhookBase,
          webhookPayload: {
            userId: user.id,
            platform: key,
            target: "referent",
            refUrl,
          },
        };
        await startRun(opts);
        launched.push(`${key}:referent:${refUrl}`);
      } catch (e) {
        errors.push(`${key}:referent:${refUrl} → ${String(e)}`);
      }
    }
  }

  // Actualiza el status de plataformas activas a "syncing"
  if (launched.length > 0) {
    const updated = platforms.map((p) => {
      const key = normalizeKey(p);
      if (!key) return p;
      if (p.status !== "activo" && p.status !== "active") return p;
      return { ...p, status: "activo", sync_status: "syncing" };
    });
    await supabase
      .from("profiles")
      .update({ platforms: updated })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ launched, errors });
}
