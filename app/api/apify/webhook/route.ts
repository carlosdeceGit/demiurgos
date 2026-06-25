// POST /api/apify/webhook
// Apify llama aquí cuando un run termina (éxito o fallo).
// Descarga los posts del dataset y los inserta individualmente en social_posts.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db/server";
import { fetchDataset } from "@/lib/apify/client";
import { extractPost, type PlatformKey } from "@/lib/apify/actors";
import { PLATFORM_KEYS } from "@/lib/ai/platforms";

type WebhookPayload = {
  userId?: string;
  platform?: string;
  target?: "own" | "referent";
  refUrl?: string;
  runId?: string;
  status?: string;
  datasetId?: string;
};

export async function POST(req: Request) {
  let body: WebhookPayload;
  try {
    body = (await req.json()) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, platform, target, refUrl, status, datasetId } = body;

  if (status !== "ACTOR.RUN.SUCCEEDED") {
    return NextResponse.json({ skipped: true, status });
  }

  if (!userId || !platform || !datasetId || !target) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!(PLATFORM_KEYS as readonly string[]).includes(platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  const platformKey = platform as PlatformKey;

  let items: Record<string, unknown>[];
  try {
    items = await fetchDataset(datasetId);
  } catch (e) {
    console.error("[apify/webhook] fetchDataset error:", e);
    return NextResponse.json({ error: "Dataset fetch failed" }, { status: 500 });
  }

  if (items.length === 0) {
    return NextResponse.json({ inserted: 0 });
  }

  // Usamos service-role para escribir sin sesión de usuario
  const supabase = await createServiceClient();

  // Verificar que el userId existe
  const { data: profileCheck } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  if (!profileCheck) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Borrar posts anteriores del mismo perfil para mantener datos frescos
  await supabase
    .from("social_posts")
    .delete()
    .eq("user_id", userId)
    .eq("platform", platform)
    .eq("target", target)
    .eq("account_url", target === "own" ? "" : (refUrl ?? ""));

  // Insertar posts individualmente
  const rows = items
    .map((item) => extractPost(platformKey, item))
    .filter((p) => p.post_text.trim().length > 0)
    .map((p) => ({
      user_id: userId,
      platform,
      account_url: target === "referent" ? (refUrl ?? "") : "",
      target,
      post_text: p.post_text,
      post_date: p.post_date,
      engagement: p.engagement,
      raw: p.raw,
    }));

  const { error } = await supabase.from("social_posts").insert(rows);

  if (error) {
    console.error("[apify/webhook] insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Actualizar sync_status en profiles.platforms si es perfil propio
  if (target === "own") {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("platforms")
      .eq("user_id", userId)
      .single();

    if (profileData?.platforms && Array.isArray(profileData.platforms)) {
      const updated = (profileData.platforms as Array<Record<string, unknown>>).map((p) => {
        if ((p.key ?? p.platform) === platform) {
          return { ...p, sync_status: "synced", last_synced_at: new Date().toISOString() };
        }
        return p;
      });
      await supabase.from("profiles").update({ platforms: updated }).eq("user_id", userId);
    }
  }

  // Dispara la síntesis en segundo plano (fire-and-forget, no bloqueamos la respuesta)
  const synthUrl = `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host")}/api/apify/synthesize`;
  fetch(synthUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, platform }),
  }).catch((e) => console.error("[webhook] synthesize trigger failed:", e));

  return NextResponse.json({ inserted: rows.length, platform, target });
}
