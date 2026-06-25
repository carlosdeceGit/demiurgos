// POST /api/apify/webhook
// Apify llama aquí cuando un run termina (éxito o fallo).
// Descarga los posts del dataset y los inserta como signals en Supabase.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { fetchDataset } from "@/lib/apify/client";
import { formatPosts, type PlatformKey } from "@/lib/apify/actors";
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

  // Solo procesamos runs exitosos con datos válidos
  if (status !== "ACTOR.RUN.SUCCEEDED") {
    return NextResponse.json({ skipped: true, status });
  }

  if (!userId || !platform || !datasetId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!(PLATFORM_KEYS as readonly string[]).includes(platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  const platformKey = platform as PlatformKey;

  // Descarga los posts desde el dataset de Apify
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

  const formatted = formatPosts(platformKey, items);

  // Construye el content del signal
  const label =
    target === "own"
      ? `Tu perfil de ${platform}`
      : `Referente en ${platform}: ${refUrl ?? ""}`;

  const content = `${label}\n\n${formatted}`;

  // Usamos el service-role client para escribir desde webhook (no hay sesión)
  const { createClient: createServiceClient } = await import("@/lib/db/server");
  const supabase = await createServiceClient();

  // Verificar que el userId existe (seguridad básica)
  const { data: profileCheck } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .single();

  if (!profileCheck) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error } = await supabase.from("signals").insert({
    user_id: userId,
    content,
    type: target === "own" ? "social_own" : "social_referent",
    source: "apify",
  });

  if (error) {
    console.error("[apify/webhook] insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Marca sync_status como "synced" si es perfil propio
  if (target === "own") {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("platforms")
      .eq("user_id", userId)
      .single();

    if (profileData?.platforms && Array.isArray(profileData.platforms)) {
      const updated = (
        profileData.platforms as Array<Record<string, unknown>>
      ).map((p) => {
        if ((p.key ?? p.platform) === platform) {
          return { ...p, sync_status: "synced", last_synced_at: new Date().toISOString() };
        }
        return p;
      });
      await supabase
        .from("profiles")
        .update({ platforms: updated })
        .eq("user_id", userId);
    }
  }

  return NextResponse.json({ inserted: 1, platform, target });
}
