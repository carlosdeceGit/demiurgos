import {
  ORCHESTRATOR_HOOK_PROMPT,
  ORCHESTRATOR_JUDGE_PROMPT,
  ORCHESTRATOR_SELECT_PROMPT,
  ORCHESTRATOR_SYNTH_PROMPT,
} from "@/lib/ai/agents/prompts";
import { runObjectAgent } from "@/lib/ai/agents/run-object";
import { runTrendAnalyst } from "@/lib/ai/agents/trend-analyst";
import { runIdeaGenerator } from "@/lib/ai/agents/idea-generator";
import { runScriptWriter } from "@/lib/ai/agents/script-writer";
import { runImageDirector } from "@/lib/ai/agents/image-director";
import { runVideoDirector } from "@/lib/ai/agents/video-director";
import { runAudioDirector } from "@/lib/ai/agents/audio-director";
import { getTrendGrounding } from "@/lib/ai/trends";
import type { TrendSourceConfig } from "@/lib/ai/trends";
import {
  HookReviewSchema,
  JudgeVerdictSchema,
  SelectionSchema,
  SchedulePlanSchema,
  type AudioBrief,
  type CalendarPost,
  type HookReview,
  type Idea,
  type ImageBrief,
  type Script,
  type SchedulePlan,
  type Selection,
  type TrendReport,
  type VideoBrief,
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
  // Productores por pieza. Cada uno con su 2.º modelo de COMPETICIÓN opcional
  // (null = sin competición). Se resuelven en resolve-models.ts por usuario.
  script: string;
  scriptCompetitor?: string | null;
  imageDirector: string;
  imageCompetitor?: string | null;
  video: string;
  videoCompetitor?: string | null;
  audio: string;
  audioCompetitor?: string | null;
};

export type PipelineInput = {
  systemContext: string;
  platforms: string[];
  models: OrchestratorModels;
  // Fuentes de tendencias en tiempo real (opcional, degradable).
  trendSources?: TrendSourceConfig;
  dateISO?: string;
  maxPosts?: number;
  // Temas/ángulos de semanas anteriores (anti-repetición). Opcional.
  recentIdeas?: string[];
};

// Qué productores activa el orquestador según el TIPO de la pieza. El orquestador
// reparte solo lo que cada tipo necesita (no malgasta vídeo en un post de texto).
export function producersFor(contentType: string): {
  script: boolean;
  image: boolean;
  video: boolean;
  audio: boolean;
} {
  switch (contentType) {
    case "post_text":
      return { script: true, image: false, video: false, audio: false };
    case "post_image":
    case "carousel":
      return { script: true, image: true, video: false, audio: false };
    case "video_script":
    case "video_live":
      return { script: true, image: true, video: true, audio: true };
    case "music":
      return { script: true, image: true, video: false, audio: true };
    case "mixed":
      return { script: true, image: true, video: true, audio: true };
    default:
      // Tipo desconocido: produce todo (degradación segura).
      return { script: true, image: true, video: true, audio: true };
  }
}

// Red de seguridad del MIX: aunque el prompt lo pida, recorta el exceso de piezas
// promocionales (máx 2). No fabrica categorías que falten: eso es trabajo del
// selector; aquí solo evitamos el fallo más dañino (lote demasiado comercial).
export function balanceSelection(ideas: Idea[], maxPromotional = 2): Idea[] {
  let promo = 0;
  return ideas.filter((idea) => {
    if (idea.content_category !== "promotional") return true;
    promo += 1;
    return promo <= maxPromotional;
  });
}

// Aplica la revisión de ganchos: sustituye el hook por el FINAL que devolvió el
// orquestador (por índice), si trae uno no vacío. Si no hay revisión, no toca nada.
export function applyHookReview(
  ideas: Idea[],
  review: HookReview | null
): Idea[] {
  if (!review) return ideas;
  const byIndex = new Map(review.hooks.map((h) => [h.index, h]));
  return ideas.map((idea, i) => {
    const r = byIndex.get(i);
    return r && r.hook.trim() ? { ...idea, hook: r.hook.trim() } : idea;
  });
}

function buildHookPrompt(ideas: Idea[]): string {
  const numbered = ideas
    .map((idea, i) =>
      JSON.stringify({
        index: i,
        hook: idea.hook,
        topic: idea.topic,
        angle: idea.angle,
        platform: idea.platform,
      })
    )
    .join("\n");
  return [
    "Ideas elegidas a revisar (índice: idea):",
    numbered,
    "Puntúa cada hook (1-10) y devuelve el hook final por índice (reescribe los < 7).",
  ].join("\n");
}

export type RunRecord = { role: string; model: string; tokens: number | null };

export type OrchestratorEvent =
  | { type: "phase"; phase: string; status: "start" | "done"; detail?: string }
  | { type: "trend-sources"; sources: string[] }
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
  video: VideoBrief | null;
  audio: AudioBrief | null;
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
      content_type: e.idea.content_type,
      content_category: e.idea.content_category,
      script: e.script?.script ?? "",
      caption: e.script?.caption ?? "",
      hashtags: e.script?.hashtags ?? [],
      cta: e.script?.cta ?? "",
      image_prompt: e.brief?.image_prompt ?? "",
      video_prompt: e.brief?.video_prompt ?? null,
      aspect_ratio: e.brief?.aspect_ratio ?? null,
      cover_description: e.brief?.cover_description ?? null,
      slide_image_prompts: e.brief?.slide_image_prompts ?? null,
      video_brief: e.video,
      audio_brief: e.audio,
      slides: e.script?.slides ?? null,
      // music_brief y pieces: reservados para "music"/"mixed" (futuro), hoy null.
      music_brief: null,
      pieces: null,
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

// ── Etapa de productor con COMPETICIÓN (genérica) ─────────────
// Encarga el MISMO entregable (guión, imagen, vídeo, audio) a uno o dos modelos.
// Con 2.º contendiente, el ORQUESTADOR hace de juez. Nunca lanza: degrada.
//  - 0 responden → null (degradado, se añade `role` a degraded[] fuera).
//  - 1 responde  → gana por incomparecencia (sin juez).
//  - 2 responden → el orquestador juzga; si el juez falla, gana A (el del usuario).
type StageRun<T> = { value: T; tokens: number | null; model: string };

async function runCompetitiveStage<T>(args: {
  orchestratorModel: string;
  systemContext: string;
  idea: Idea;
  role: string; // "script" | "image_director" | "video" | "audio"
  kind: string; // etiqueta legible del entregable para el juez
  primary: string;
  competitor?: string | null;
  run: (modelId: string) => Promise<StageRun<T>>;
}): Promise<{ value: T | null; runs: RunRecord[] }> {
  const { orchestratorModel, systemContext, idea, role, kind, primary } = args;
  const runs: RunRecord[] = [];

  // Sin competición: una sola llamada.
  if (!args.competitor) {
    try {
      const r = await args.run(primary);
      runs.push({ role, model: r.model, tokens: r.tokens });
      return { value: r.value, runs };
    } catch {
      return { value: null, runs };
    }
  }

  // Competición: los dos a la vez.
  const [a, b] = await Promise.allSettled([
    args.run(primary),
    args.run(args.competitor),
  ]);
  const candA = a.status === "fulfilled" ? a.value : null;
  const candB = b.status === "fulfilled" ? b.value : null;
  if (candA) runs.push({ role, model: candA.model, tokens: candA.tokens });
  if (candB) runs.push({ role: `${role}_b`, model: candB.model, tokens: candB.tokens });

  // 0 o 1 respuestas: sin juicio.
  if (!candA && !candB) return { value: null, runs };
  if (!candA || !candB) return { value: (candA ?? candB)!.value, runs };

  // 2 respuestas: el orquestador juzga.
  try {
    const { object, tokens } = await runObjectAgent({
      modelId: orchestratorModel,
      systemContext,
      rolePrompt: ORCHESTRATOR_JUDGE_PROMPT,
      prompt: buildJudgePrompt(kind, idea, candA.value, candB.value),
      schema: JudgeVerdictSchema,
      schemaName: "JudgeVerdict",
    });
    runs.push({ role: `${role}_judge`, model: orchestratorModel, tokens });
    return { value: object.winner === "B" ? candB.value : candA.value, runs };
  } catch {
    // El juez falló: nos quedamos con el preferido del usuario (A).
    return { value: candA.value, runs };
  }
}

function buildJudgePrompt(kind: string, idea: Idea, a: unknown, b: unknown): string {
  return [
    `Entregable juzgado: ${kind}.`,
    "Idea de partida:",
    "```json",
    JSON.stringify(idea, null, 2),
    "```",
    "Candidato A (preferido del usuario):",
    "```json",
    JSON.stringify(a, null, 2),
    "```",
    "Candidato B (rival):",
    "```json",
    JSON.stringify(b, null, 2),
    "```",
    "Elige el mejor para publicar (winner 'A' o 'B') y una frase de porqué.",
  ].join("\n");
}

// ── Pipeline ──────────────────────────────────────────────────

export async function* runCalendarPipeline(
  input: PipelineInput
): AsyncGenerator<OrchestratorEvent> {
  const { systemContext, platforms, models } = input;
  const dateISO = input.dateISO ?? new Date().toISOString().slice(0, 10);
  const maxPosts = input.maxPosts ?? DEFAULT_MAX_POSTS;
  const runs: RunRecord[] = [];

  // ── Fase 0 · Datos reales de tendencias (opcional, degradable) ──
  let grounding: string | null = null;
  if (input.trendSources?.enabled) {
    yield { type: "phase", phase: "trend-sources", status: "start" };
    try {
      const g = await getTrendGrounding(input.trendSources);
      if (g) {
        grounding = g.text;
        yield { type: "trend-sources", sources: g.sourcesUsed };
      }
    } catch (err) {
      yield { type: "warning", scope: "trend-sources", message: errMessage(err) };
    }
    yield { type: "phase", phase: "trend-sources", status: "done" };
  }

  // ── Fase 1 · Tendencias (el perfil ya viene en systemContext) ──
  yield { type: "phase", phase: "trends", status: "start" };
  let trends: TrendReport;
  try {
    const r = await runTrendAnalyst({
      modelId: models.trend,
      systemContext,
      platforms,
      dateISO,
      grounding,
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
      recentIdeas: input.recentIdeas,
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

  // Selección del orquestador + red de seguridad del mix (recorta promo > 2).
  let chosen = balanceSelection(pickSelectedIdeas(ideas, selection, maxPosts));
  const weeklyTheme =
    selection?.weekly_theme ?? "Selección de la semana";
  const editorialNote = selection?.editorial_note ?? "";
  yield {
    type: "selection",
    weekly_theme: weeklyTheme,
    selected: chosen.length,
  };
  yield { type: "phase", phase: "selection", status: "done" };

  // ── Fase 2c · Médico de ganchos (el orquestador puntúa y reescribe los flojos) ──
  if (chosen.length > 0) {
    yield { type: "phase", phase: "hooks", status: "start" };
    try {
      const { object, tokens } = await runObjectAgent({
        modelId: models.orchestrator,
        systemContext,
        rolePrompt: ORCHESTRATOR_HOOK_PROMPT,
        prompt: buildHookPrompt(chosen),
        schema: HookReviewSchema,
        schemaName: "HookReview",
      });
      const improved = object.hooks.filter((h) => h.score < 7).length;
      chosen = applyHookReview(chosen, object);
      runs.push({ role: "hook_doctor", model: models.orchestrator, tokens });
      yield {
        type: "phase",
        phase: "hooks",
        status: "done",
        detail: `${improved} gancho(s) reescrito(s)`,
      };
    } catch (err) {
      // Degradable: si falla, seguimos con los hooks originales.
      yield { type: "warning", scope: "hooks", message: errMessage(err) };
      yield { type: "phase", phase: "hooks", status: "done" };
    }
  }

  // ── Fase 3 · Enriquecido en paralelo (script + image director por idea) ──
  yield { type: "phase", phase: "enrich", status: "start" };
  const skip = <T>(): { value: T | null; runs: RunRecord[] } => ({
    value: null,
    runs: [],
  });

  const enriched: Enriched[] = await Promise.all(
    chosen.map(async (idea) => {
      const degraded: string[] = [];
      // El orquestador reparte SOLO los productores que pide este tipo de pieza
      // (un post de texto no gasta vídeo/audio). Cada uno puede COMPETIR
      // (dos modelos + el orquestador de juez) y ninguno lanza: degrada solo.
      const need = producersFor(idea.content_type);
      const [scriptStage, imageStage, videoStage, audioStage] =
        await Promise.all([
          need.script
            ? runCompetitiveStage<Script>({
                orchestratorModel: models.orchestrator,
                systemContext,
                idea,
                role: "script",
                kind: "guión y copy",
                primary: models.script,
                competitor: models.scriptCompetitor,
                run: (modelId) =>
                  runScriptWriter({ modelId, systemContext, idea }).then((r) => ({
                    value: r.script,
                    tokens: r.tokens,
                    model: r.model,
                  })),
              })
            : skip<Script>(),
          need.image
            ? runCompetitiveStage<ImageBrief>({
                orchestratorModel: models.orchestrator,
                systemContext,
                idea,
                role: "image_director",
                kind: "brief visual",
                primary: models.imageDirector,
                competitor: models.imageCompetitor,
                run: (modelId) =>
                  runImageDirector({ modelId, systemContext, idea }).then((r) => ({
                    value: r.brief,
                    tokens: r.tokens,
                    model: r.model,
                  })),
              })
            : skip<ImageBrief>(),
          need.video
            ? runCompetitiveStage<VideoBrief>({
                orchestratorModel: models.orchestrator,
                systemContext,
                idea,
                role: "video",
                kind: "dirección de vídeo",
                primary: models.video,
                competitor: models.videoCompetitor,
                run: (modelId) =>
                  runVideoDirector({ modelId, systemContext, idea }).then((r) => ({
                    value: r.brief,
                    tokens: r.tokens,
                    model: r.model,
                  })),
              })
            : skip<VideoBrief>(),
          need.audio
            ? runCompetitiveStage<AudioBrief>({
                orchestratorModel: models.orchestrator,
                systemContext,
                idea,
                role: "audio",
                kind: "guion de audio",
                primary: models.audio,
                competitor: models.audioCompetitor,
                run: (modelId) =>
                  runAudioDirector({ modelId, systemContext, idea }).then((r) => ({
                    value: r.brief,
                    tokens: r.tokens,
                    model: r.model,
                  })),
              })
            : skip<AudioBrief>(),
        ]);

      runs.push(
        ...scriptStage.runs,
        ...imageStage.runs,
        ...videoStage.runs,
        ...audioStage.runs
      );
      // Solo es "degradado" si el tipo lo pedía y falló (no si se omitió a propósito).
      if (need.script && !scriptStage.value) degraded.push("script");
      if (need.image && !imageStage.value) degraded.push("image_director");
      if (need.video && !videoStage.value) degraded.push("video");
      if (need.audio && !audioStage.value) degraded.push("audio");

      return {
        idea,
        script: scriptStage.value,
        brief: imageStage.value,
        video: videoStage.value,
        audio: audioStage.value,
        degraded,
      } satisfies Enriched;
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
