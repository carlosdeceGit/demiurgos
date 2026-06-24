import { createAdminClient } from "@/lib/db/admin";
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  composeSystemPrompt,
  gatherContext,
} from "@/lib/ai/compose-context";
import { activePlatformKeys } from "@/lib/ai/platforms";
import { getTrendSettings } from "@/lib/db/settings";
import { getUserModelPreferences } from "@/lib/db/user-settings";
import { resolvePipelineModels } from "@/lib/ai/resolve-models";
import { resolveTrendConfig } from "@/lib/ai/trends";
import {
  generateCalendar,
  type RunRecord,
} from "@/lib/ai/orchestrator";
import type { WeeklyCalendar } from "@/lib/ai/agents/schemas";

// Vercel Cron llama a este endpoint cada lunes a las 07:00 UTC.
// Valida CRON_SECRET para evitar invocaciones no autorizadas.
export const maxDuration = 300;

function mondayOf(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

async function recentIdeaSummaries(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("proposals")
      .select("based_on, idea")
      .eq("user_id", userId)
      .gte(
        "created_at",
        new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      )
      .limit(30);
    return (data ?? []).map((p: { based_on: unknown; idea: string | null }) => {
      const b = p.based_on as Record<string, unknown> | null;
      const hook = typeof b?.hook === "string" ? b.hook : (p.idea ?? "");
      return hook;
    });
  } catch {
    return [];
  }
}

async function persistCalendar(
  supabase: SupabaseClient,
  userId: string,
  calendar: WeeklyCalendar,
  runs: RunRecord[],
  orchestratorModel: string
): Promise<void> {
  const weekOf = mondayOf(new Date());

  const proposalRows = calendar.posts.map((p) => ({
    user_id: userId,
    week_of: weekOf,
    platform: p.platform,
    idea: p.topic,
    why_now: p.why_now,
    script: p.script,
    image_prompt: p.image_prompt,
    content_type: p.content_type,
    content_category: p.content_category,
    suggested_slot: [p.day, p.best_time].filter(Boolean).join(" ") || null,
    status: "nueva",
    expires_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    based_on: {
      weekly_theme: calendar.weekly_theme,
      hook: p.hook,
      caption: p.caption,
      hashtags: p.hashtags,
      format: p.format,
      angle: p.angle,
      pillar: p.pillar,
    },
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from("proposals").insert(proposalRows as any);

  if (runs.length > 0) {
    const aiRunRows = runs.map((r) => ({
      user_id: userId,
      role: r.role,
      model: r.model,
      tokens: r.tokens,
      orchestrator_model: orchestratorModel,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("ai_runs").insert(aiRunRows as any);
  }
}

async function generateForUser(
  userId: string,
  trendSettings: Awaited<ReturnType<typeof getTrendSettings>>
): Promise<{ ok: boolean; error?: string }> {
  // Construir un cliente Supabase con service role pero impersonando al usuario
  // con la API de admin (for RLS-aware reads como gatherContext espera).
  // Usamos el cliente de service role directamente ya que gatherContext con admin
  // client (sin RLS) es seguro aquí: solo leemos datos del userId indicado.
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    const context = await gatherContext(supabase as Parameters<typeof gatherContext>[0], userId);
    if (!context.profile) return { ok: false, error: "sin perfil" };

    const systemContext = composeSystemPrompt(context);
    const platforms = activePlatformKeys(context.profile.platforms ?? null);
    if (platforms.length === 0) return { ok: false, error: "sin plataformas" };

    const prefs = await getUserModelPreferences(supabase as Parameters<typeof getUserModelPreferences>[0], userId);
    const models = resolvePipelineModels(prefs);
    const trendSources = resolveTrendConfig({
      enabled: trendSettings.enabled,
      provider: trendSettings.provider,
      sourcesCsv: trendSettings.sources,
    });
    const recentIdeas = await recentIdeaSummaries(supabase, userId);

    const { calendar, runs } = await generateCalendar({
      systemContext,
      platforms,
      models,
      trendSources,
      recentIdeas,
    });

    await persistCalendar(supabase, userId, calendar, runs, models.orchestrator);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET(req: Request) {
  // Validar el secret que Vercel envía en la cabecera Authorization
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const trendSettings = await getTrendSettings();

  // Todos los usuarios con onboarding completado
  const { data: users, error } = await admin
    .from("profiles")
    .select("user_id")
    .eq("onboarding_completed", true);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results: { userId: string; ok: boolean; error?: string }[] = [];

  // Procesamos secuencialmente para no saturar el rate limit de la API de IA.
  for (const row of users ?? []) {
    const result = await generateForUser(row.user_id, trendSettings);
    results.push({ userId: row.user_id, ...result });
    // Pequeña pausa entre usuarios para no aplastar el gateway
    await new Promise((r) => setTimeout(r, 2000));
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return Response.json({ succeeded, failed, results });
}
