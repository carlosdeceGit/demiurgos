import { createClient } from "@/lib/db/server";
import {
  composeSystemPrompt,
  gatherContext,
} from "@/lib/ai/compose-context";
import { activePlatformKeys } from "@/lib/ai/platforms";
import { getModelSettings, getTrendSettings } from "@/lib/db/settings";
import { resolveTrendConfig } from "@/lib/ai/trends";
import {
  runCalendarPipeline,
  type OrchestratorEvent,
  type RunRecord,
} from "@/lib/ai/orchestrator";
import type { WeeklyCalendar } from "@/lib/ai/agents/schemas";

// El pipeline completo puede tardar; pedimos margen de ejecución.
export const maxDuration = 300;

// Lunes (YYYY-MM-DD) de la semana de una fecha, para proposals.week_of (date).
function mondayOf(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const day = d.getUTCDay() || 7; // domingo = 7
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

function sse(ev: OrchestratorEvent): string {
  return `data: ${JSON.stringify(ev)}\n\n`;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autenticado", { status: 401 });
  }

  // Contexto compuesto (motor + perfil + conocimiento + señales). El perfil va
  // dentro del system, así que la "fase 1 · perfil builder" del doc ya está hecha.
  const context = await gatherContext(supabase, user.id);
  if (!context.profile) {
    return new Response(
      "Sin perfil: completa el onboarding antes de generar el calendario.",
      { status: 422 }
    );
  }
  const systemContext = composeSystemPrompt(context);
  const platforms = activePlatformKeys(context.profile.platforms ?? null);
  const [settings, trendSettings] = await Promise.all([
    getModelSettings(),
    getTrendSettings(),
  ]);
  const trendSources = resolveTrendConfig({
    enabled: trendSettings.enabled,
    provider: trendSettings.provider,
    sourcesCsv: trendSettings.sources,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: OrchestratorEvent) => {
        try {
          controller.enqueue(encoder.encode(sse(ev)));
        } catch {
          // cliente desconectado: seguimos para terminar la persistencia.
        }
      };

      try {
        for await (const ev of runCalendarPipeline({
          systemContext,
          platforms,
          models: {
            orchestrator: settings.orchestratorModel,
            trend: settings.trendModel,
            idea: settings.ideaModel,
            script: settings.scriptModel,
            imageDirector: settings.imageDirectorModel,
          },
          trendSources,
        })) {
          send(ev);
          if (ev.type === "done") {
            await persist(supabase, user.id, ev.calendar, ev.runs, settings.orchestratorModel);
          }
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// Persiste el calendario (una fila proposals por post) y la traza ai_runs.
// Best-effort: un fallo aquí no debe romper el stream (el usuario ya tiene el JSON).
async function persist(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
    video_prompt: p.video_prompt,
    suggested_slot: [p.day, p.best_time].filter(Boolean).join(" ") || null,
    status: "draft",
    based_on: {
      weekly_theme: calendar.weekly_theme,
      hook: p.hook,
      caption: p.caption,
      hashtags: p.hashtags,
      cta: p.cta,
      format: p.format,
      angle: p.angle,
      pillar: p.pillar,
      aspect_ratio: p.aspect_ratio,
      cover_description: p.cover_description,
      rationale: p.rationale,
      degraded: p.degraded,
    },
    model_used: orchestratorModel,
  }));

  const runRows = runs.map((r) => ({
    user_id: userId,
    role: r.role,
    model: r.model,
    input_summary: "calendar pipeline",
    output_summary: calendar.week,
    tokens: r.tokens,
  }));

  try {
    if (proposalRows.length > 0) {
      await supabase.from("proposals").insert(proposalRows);
    }
    if (runRows.length > 0) {
      await supabase.from("ai_runs").insert(runRows);
    }
  } catch {
    // best-effort
  }
}
