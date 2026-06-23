import {
  ORCHESTRATOR_SELECT_PROMPT,
  ORCHESTRATOR_SYNTH_PROMPT,
} from "@/lib/ai/agents/prompts";
import { runObjectAgent } from "@/lib/ai/agents/run-object";
import { runTrendAnalyst } from "@/lib/ai/agents/trend-analyst";
import { runIdeaGenerator } from "@/lib/ai/agents/idea-generator";
import { runScriptWriter } from "@/lib/ai/agents/script-writer";
import { runImageDirector } from "@/lib/ai/agents/image-director";
import {
  SelectionSchema,
  SchedulePlanSchema,
  type CalendarPost,
  type Idea,
  type ImageBrief,
  type Script,
  type SchedulePlan,
  type Selection,
  type TrendReport,
  type WeeklyCalendar,
} from "@/lib/ai/agents/schemas";

// ─────────────────────────────────────────────────────────────
// Orquestador multi-agente. Ejecuta el pipeline por fases (paralelo donde se
// puede) y va EMITIENDO eventos de progreso (async generator) para que el
// frontend vea el razonamiento construirse, no espere 40s a ciegas.
//
// Principio del doc: degradación graceful. Ningún agente periférico puede
// tumbar el pipeline; si falla, se anota y se sigue.
// ─────────────────────────────────────────────────────────────

export type OrchestratorModels = {
  orchestrator: string;
  trend: string;
  idea: string;
  script: string;
  imageDirector: string;
};

export type PipelineInput = {
  systemContext: string;
  platforms: string[];
  models: OrchestratorModels;
  dateISO?: string;
  maxPosts?: number;
};

export type RunRecord = { role: string; model: string; tokens: number | null };

export type OrchestratorEvent =
  | { type: "phase"; phase: string; status: "start" | "done"; detail?: string }
  | { type: "trends"; report: TrendReport }
  | { type: "ideas"; count: number }
  | { type: "selection"; weekly_theme: string; selected: number }
  | {
      type: "post";
      index: number;
      status: "start" | "done";
      hook?: string;
      degraded?: string[];
    }
  | { type: "warning"; scope: string; message: string }
  | { type: "done"; calendar: WeeklyCalendar; runs: RunRecord[] }
  | { type: "error"; message: string };

const DEFAULT_MAX_POSTS = 7;

// ── Helpers puros (testeables sin red) ────────────────────────

export function isoWeek(d: Date): string {
  // ISO-8601 week number ("YYYY-Www").
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // domingo = 7
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Mapea la selección del orquestador a ideas reales: índices válidos, sin
// duplicados, recortado a maxPosts. Si la selección viene vacía/rota, cae a
// las primeras ideas (degradación).
export function pickSelectedIdeas(
  ideas: Idea[],
  selection: Selection | null,
  maxPosts: number
): Idea[] {
  if (ideas.length === 0) return [];
  const indices = (selection?.selected ?? [])
    .map((s) => s.idea_index)
    .filter((i) => Number.isInteger(i) && i >= 0 && i < ideas.length);
  const unique = Array.from(new Set(indices)).slice(0, maxPosts);
  if (unique.length > 0) return unique.map((i) => ideas[i]);
  return ideas.slice(0, Math.min(maxPosts, ideas.length));
}

type Enriched = {
  idea: Idea;
  script: Script | null;
  brief: ImageBrief | null;
  degraded: string[];
};

// Ensambla el calendario final en código (determinista): cruza los posts
// enriquecidos con el plan de agenda del orquestador. No lo reescribe un LLM.
export function assembleCalendar(
  week: string,
  weeklyTheme: string,
  notes: string,
  enriched: Enriched[],
  plan: SchedulePlan | null
): WeeklyCalendar {
  const scheduleByIndex = new Map(
    (plan?.schedule ?? []).map((s) => [s.post_index, s])
  );

  const posts: CalendarPost[] = enriched.map((e, index) => {
    const slot = scheduleByIndex.get(index);
    return {
      day: slot?.day ?? null,
      platform: e.idea.platform,
      format: e.idea.format,
      angle: e.idea.angle,
      pillar: e.idea.pillar,
      topic: e.idea.topic,
      hook: e.idea.hook,
      script: e.script?.script ?? "",
      caption: e.script?.caption ?? "",
      hashtags: e.script?.hashtags ?? [],
      cta: e.script?.cta ?? "",
      image_prompt: e.brief?.image_prompt ?? "",
      video_prompt: e.brief?.video_prompt ?? null,
      aspect_ratio: e.brief?.aspect_ratio ?? null,
      cover_description: e.brief?.cover_description ?? null,
      best_time: slot?.best_time ?? e.script?.best_time ?? null,
      why_now: e.idea.why_now,
      rationale: slot?.rationale ?? null,
      degraded: e.degraded,
    };
  });

  return {
    week,
    weekly_theme: plan?.weekly_theme || weeklyTheme,
    posts,
    notes: plan?.notes || notes,
  };
}

function emptyTrends(): TrendReport {
  return {
    trending_topics: [],
    winning_formats: [],
    competitor_moves: [],
    weekly_context: "Sin informe de tendencias (el analista no respondió).",
    avoid_this_week: [],
  };
}

// ── Pipeline ──────────────────────────────────────────────────

export async function* runCalendarPipeline(
  input: PipelineInput
): AsyncGenerator<OrchestratorEvent> {
  const { systemContext, platforms, models } = input;
  const dateISO = input.dateISO ?? new Date().toISOString().slice(0, 10);
  const maxPosts = input.maxPosts ?? DEFAULT_MAX_POSTS;
  const runs: RunRecord[] = [];

  // ── Fase 1 · Tendencias (el perfil ya viene en systemContext) ──
  yield { type: "phase", phase: "trends", status: "start" };
  let trends: TrendReport;
  try {
    const r = await runTrendAnalyst({
      modelId: models.trend,
      systemContext,
      platforms,
      dateISO,
    });
    trends = r.report;
    runs.push({ role: "trend", model: r.model, tokens: r.tokens });
    yield { type: "trends", report: trends };
  } catch (err) {
    trends = emptyTrends();
    yield {
      type: "warning",
      scope: "trends",
      message: errMessage(err),
    };
  }
  yield { type: "phase", phase: "trends", status: "done" };

  // ── Fase 2 · Ideas (necesita las tendencias) ──
  yield { type: "phase", phase: "ideas", status: "start" };
  let ideas: Idea[];
  try {
    const r = await runIdeaGenerator({
      modelId: models.idea,
      systemContext,
      trends,
    });
    ideas = r.list.ideas;
    runs.push({ role: "idea", model: r.model, tokens: r.tokens });
    yield { type: "ideas", count: ideas.length };
  } catch (err) {
    yield { type: "error", message: `Generador de ideas: ${errMessage(err)}` };
    return;
  }
  yield { type: "phase", phase: "ideas", status: "done" };

  // ── Fase 2b · Filtrado del orquestador ──
  yield { type: "phase", phase: "selection", status: "start" };
  let selection: Selection | null = null;
  try {
    const { object, tokens } = await runObjectAgent({
      modelId: models.orchestrator,
      systemContext,
      rolePrompt: ORCHESTRATOR_SELECT_PROMPT,
      prompt: buildSelectionPrompt(ideas, trends),
      schema: SelectionSchema,
      schemaName: "Selection",
    });
    selection = object;
    runs.push({ role: "orchestrator", model: models.orchestrator, tokens });
  } catch (err) {
    yield { type: "warning", scope: "selection", message: errMessage(err) };
  }

  const chosen = pickSelectedIdeas(ideas, selection, maxPosts);
  const weeklyTheme =
    selection?.weekly_theme ?? "Selección de la semana";
  const editorialNote = selection?.editorial_note ?? "";
  yield {
    type: "selection",
    weekly_theme: weeklyTheme,
    selected: chosen.length,
  };
  yield { type: "phase", phase: "selection", status: "done" };

  // ── Fase 3 · Enriquecido en paralelo (script + image director por idea) ──
  yield { type: "phase", phase: "enrich", status: "start" };
  const enriched: Enriched[] = await Promise.all(
    chosen.map(async (idea) => {
      const degraded: string[] = [];
      const [scriptRes, briefRes] = await Promise.allSettled([
        runScriptWriter({ modelId: models.script, systemContext, idea }),
        runImageDirector({
          modelId: models.imageDirector,
          systemContext,
          idea,
        }),
      ]);

      let script: Script | null = null;
      if (scriptRes.status === "fulfilled") {
        script = scriptRes.value.script;
        runs.push({
          role: "script",
          model: scriptRes.value.model,
          tokens: scriptRes.value.tokens,
        });
      } else {
        degraded.push("script");
      }

      let brief: ImageBrief | null = null;
      if (briefRes.status === "fulfilled") {
        brief = briefRes.value.brief;
        runs.push({
          role: "image_director",
          model: briefRes.value.model,
          tokens: briefRes.value.tokens,
        });
      } else {
        degraded.push("image_director");
      }

      return { idea, script, brief, degraded } satisfies Enriched;
    })
  );

  // Emitimos un evento por post (después del Promise.all: el orden es estable).
  for (let i = 0; i < enriched.length; i++) {
    const e = enriched[i];
    yield {
      type: "post",
      index: i,
      status: "done",
      hook: e.idea.hook,
      degraded: e.degraded,
    };
  }
  yield { type: "phase", phase: "enrich", status: "done" };

  // ── Fase 4 · Síntesis / ensamblado ──
  yield { type: "phase", phase: "synthesis", status: "start" };
  let plan: SchedulePlan | null = null;
  try {
    const { object, tokens } = await runObjectAgent({
      modelId: models.orchestrator,
      systemContext,
      rolePrompt: ORCHESTRATOR_SYNTH_PROMPT,
      prompt: buildSynthesisPrompt(enriched, weeklyTheme),
      schema: SchedulePlanSchema,
      schemaName: "SchedulePlan",
    });
    plan = object;
    runs.push({ role: "orchestrator", model: models.orchestrator, tokens });
  } catch (err) {
    yield { type: "warning", scope: "synthesis", message: errMessage(err) };
  }

  const week = isoWeek(new Date(dateISO));
  const calendar = assembleCalendar(
    week,
    weeklyTheme,
    editorialNote,
    enriched,
    plan
  );
  yield { type: "phase", phase: "synthesis", status: "done" };
  yield { type: "done", calendar, runs };
}

// Conveniencia no-streaming: drena el generador y devuelve el calendario final.
export async function generateCalendar(
  input: PipelineInput
): Promise<{ calendar: WeeklyCalendar; runs: RunRecord[] }> {
  let result: { calendar: WeeklyCalendar; runs: RunRecord[] } | null = null;
  for await (const ev of runCalendarPipeline(input)) {
    if (ev.type === "done") result = { calendar: ev.calendar, runs: ev.runs };
    if (ev.type === "error") throw new Error(ev.message);
  }
  if (!result) throw new Error("El pipeline no produjo calendario.");
  return result;
}

// ── Prompts del orquestador (dependen de salidas previas) ─────

function buildSelectionPrompt(ideas: Idea[], trends: TrendReport): string {
  const numbered = ideas
    .map((idea, i) => `${i}: ${JSON.stringify(idea)}`)
    .join("\n");
  return [
    "Tendencias de la semana:",
    "```json",
    JSON.stringify(trends, null, 2),
    "```",
    "Ideas candidatas (índice: idea):",
    numbered,
    "Selecciona las 5-7 mejores por índice y da el hilo de la semana.",
  ].join("\n");
}

function buildSynthesisPrompt(
  enriched: Enriched[],
  weeklyTheme: string
): string {
  const posts = enriched
    .map((e, i) =>
      JSON.stringify({
        index: i,
        platform: e.idea.platform,
        format: e.idea.format,
        topic: e.idea.topic,
        hook: e.idea.hook,
        has_script: e.script !== null,
        has_image: e.brief !== null,
      })
    )
    .join("\n");
  return [
    `Hilo provisional de la semana: ${weeklyTheme}`,
    "Posts enriquecidos a agendar (índice: resumen):",
    posts,
    "Devuelve el plan de agenda (un schedule por índice), weekly_theme y notes.",
  ].join("\n");
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
