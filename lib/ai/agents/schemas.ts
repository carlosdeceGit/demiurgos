import { z } from "zod";

import { PLATFORM_KEYS } from "@/lib/ai/platforms";

// ─────────────────────────────────────────────────────────────
// Esquemas Zod compartidos por todos los agentes del orquestador.
// Regla del doc: NINGÚN agente devuelve texto libre. Todo es generateObject
// con un esquema tipado, validado antes de que lo lea el orquestador.
// ─────────────────────────────────────────────────────────────

// Plataformas canónicas (las mismas que el perfil y el conocimiento).
export const platformEnum = z.enum(
  PLATFORM_KEYS as unknown as [string, ...string[]]
);

// Formatos neutrales, válidos para cualquier sector.
export const formatEnum = z.enum([
  "reel_corto",
  "reel_largo",
  "carrusel",
  "post_texto",
  "historia",
  "video_largo",
  "hilo",
  "newsletter",
  "directo",
]);

// Ángulos editoriales.
export const angleEnum = z.enum([
  "educativo",
  "opinion",
  "historia_personal",
  "caso_practico",
  "tendencia",
  "posicionamiento",
]);

export const aspectRatioEnum = z.enum(["1:1", "9:16", "16:9", "4:5"]);

// ── Fase 1 · Trend Analyst ────────────────────────────────────
export const TrendReportSchema = z.object({
  trending_topics: z
    .array(
      z.object({
        topic: z.string(),
        why_trending: z.string(),
        content_angle: z.string(),
      })
    )
    .describe("Temas con tracción esta semana en el nicho del usuario"),
  winning_formats: z.array(z.string()),
  competitor_moves: z.array(
    z.object({
      profile_type: z.string(),
      what: z.string(),
      engagement: z.enum(["alto", "medio", "bajo"]),
    })
  ),
  weekly_context: z.string(),
  avoid_this_week: z.array(z.string()),
});
export type TrendReport = z.infer<typeof TrendReportSchema>;

// ── Fase 2 · Idea Generator ───────────────────────────────────
export const IdeaSchema = z.object({
  topic: z.string().describe("Asunto en pocas palabras (distinto del hook)"),
  hook: z.string().describe("Primera línea que detiene el scroll. Específica."),
  format: formatEnum,
  platform: platformEnum,
  angle: angleEnum,
  pillar: z
    .string()
    .describe("Qué pilar del perfil sirve esta idea (cita uno real)"),
  why_now: z.string().describe("Por qué funciona esta semana concreta"),
});
export type Idea = z.infer<typeof IdeaSchema>;

export const IdeaListSchema = z.object({
  ideas: z.array(IdeaSchema).min(1),
});
export type IdeaList = z.infer<typeof IdeaListSchema>;

// ── Fase 2b · Orchestrator (filtro / 2ª pasada) ───────────────
export const SelectionSchema = z.object({
  weekly_theme: z
    .string()
    .describe("Hilo narrativo que une los posts de la semana"),
  editorial_note: z
    .string()
    .describe("Por qué esta selección esta semana concreta"),
  selected: z
    .array(
      z.object({
        idea_index: z
          .number()
          .int()
          .describe("Índice (0-based) de la idea elegida en la lista recibida"),
        reason: z.string(),
      })
    )
    .min(1),
});
export type Selection = z.infer<typeof SelectionSchema>;

// ── Fase 3 · Script Writer ────────────────────────────────────
export const ScriptSchema = z.object({
  script: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  cta: z.string(),
  best_time: z.string().describe("Mejor franja para la plataforma, HH:MM"),
  format_notes: z.string(),
});
export type Script = z.infer<typeof ScriptSchema>;

// ── Fase 3 · Image Director ───────────────────────────────────
export const ImageBriefSchema = z.object({
  image_prompt: z.string(),
  video_prompt: z.string().nullable(),
  cover_description: z.string(),
  aspect_ratio: aspectRatioEnum,
  style_notes: z.string(),
});
export type ImageBrief = z.infer<typeof ImageBriefSchema>;

// ── Fase 4 · Orchestrator (síntesis / ensamblado) ─────────────
// El orquestador NO reescribe los guiones: solo agenda, da coherencia y
// explica el porqué. El calendario final se ensambla en código a partir de
// los posts ya enriquecidos + este plan.
export const SchedulePlanSchema = z.object({
  weekly_theme: z.string(),
  notes: z.string().describe("Observación editorial breve para el usuario"),
  schedule: z
    .array(
      z.object({
        post_index: z
          .number()
          .int()
          .describe("Índice (0-based) del post enriquecido"),
        day: z.enum([
          "lunes",
          "martes",
          "miércoles",
          "jueves",
          "viernes",
          "sábado",
          "domingo",
        ]),
        best_time: z.string().describe("HH:MM"),
        rationale: z.string().describe("Por qué este contenido este día"),
      })
    )
    .min(1),
});
export type SchedulePlan = z.infer<typeof SchedulePlanSchema>;

// ── Salida final ensamblada (no la pide un LLM, la construye el código) ──
export type CalendarPost = {
  day: string | null;
  platform: string;
  format: string;
  angle: string;
  pillar: string;
  topic: string;
  hook: string;
  script: string;
  caption: string;
  hashtags: string[];
  cta: string;
  image_prompt: string;
  video_prompt: string | null;
  aspect_ratio: string | null;
  cover_description: string | null;
  best_time: string | null;
  why_now: string;
  rationale: string | null;
  // Banderas de degradación: qué agentes fallaron en este post.
  degraded: string[];
};

export type WeeklyCalendar = {
  week: string;
  weekly_theme: string;
  posts: CalendarPost[];
  notes: string;
};
