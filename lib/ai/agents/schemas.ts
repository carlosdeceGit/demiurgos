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

// Taxonomía de contenido. El TIPO define qué productores activa el orquestador
// (post_text → solo guión; carousel → guión+slides+imagen; video_* → +vídeo+audio;
// music → +audio; mixed → todo). La CATEGORÍA define la intención editorial y se
// usa para equilibrar el mix de la semana.
export const contentTypeEnum = z.enum([
  "post_text", // Post sin imagen
  "post_image", // Post con imagen
  "carousel", // Carrusel de slides
  "video_script", // Guión de vídeo grabado
  "video_live", // Vídeo directo / live
  "music", // Contenido con audio protagonista
  "mixed", // Mezcla de varios formatos
]);
export type ContentType = z.infer<typeof contentTypeEnum>;

export const contentCategoryEnum = z.enum([
  "informative", // Informativo
  "educational", // Educativo
  "promotional", // Publicitario
  "awareness", // De concientización
  "entertainment", // Entretenimiento
  "trending", // Actualidad
  "curated", // De terceros
]);
export type ContentCategory = z.infer<typeof contentCategoryEnum>;

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
  content_type: contentTypeEnum.describe(
    "Tipo de pieza: define qué producción necesita (texto/imagen/carrusel/vídeo/audio/mixto)"
  ),
  content_category: contentCategoryEnum.describe(
    "Intención editorial de la pieza (para equilibrar el mix de la semana)"
  ),
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
  // Solo si la idea es un CARRUSEL: el texto de cada slide en orden. null si no.
  slides: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
        visual_brief: z.string().nullable(),
      })
    )
    .nullable()
    .describe("Slides del carrusel en orden, o null si no es carrusel"),
});
export type Script = z.infer<typeof ScriptSchema>;
export type Slide = NonNullable<Script["slides"]>[number];

// ── Fase 3 · Image Director ───────────────────────────────────
export const ImageBriefSchema = z.object({
  image_prompt: z.string(),
  video_prompt: z.string().nullable(),
  cover_description: z.string(),
  aspect_ratio: aspectRatioEnum,
  style_notes: z.string(),
  // Solo para carruseles: un image_prompt por slide, en el mismo orden que slides[].
  slide_image_prompts: z
    .array(z.string())
    .nullable()
    .describe(
      "Un image_prompt por slide (carrusel), en orden. null si no es carrusel."
    ),
});
export type ImageBrief = z.infer<typeof ImageBriefSchema>;

// ── Fase 3 · Video Director ───────────────────────────────────
// Dirección de vídeo plano a plano. La generación real (Veo/Sora/Runway) es un
// motor enchufable a futuro; aquí se produce el brief (siempre útil, barato).
export const VideoBriefSchema = z.object({
  shots: z
    .array(
      z.object({
        scene: z.string().describe("Qué pasa en este plano"),
        shot_type: z
          .enum(["talking_head", "voiceover_broll", "broll_only"])
          .describe(
            "talking_head = creador a cámara hablando; " +
            "voiceover_broll = voz en off sobre imágenes/broll; " +
            "broll_only = broll sin voz (ambiente, transición)"
          ),
        visual: z.string().describe("Encuadre, movimiento de cámara, acción"),
        on_screen_text: z
          .string()
          .nullable()
          .describe("Texto en pantalla (contenido literal) o null"),
        on_screen_text_style: z
          .string()
          .nullable()
          .describe(
            "Posición, animación y estilo del texto en pantalla (p.ej. 'centrado, aparece en fade 0.3s, Geist Bold blanco con sombra'). null si no hay texto."
          ),
        broll_ai_prompt: z
          .string()
          .nullable()
          .describe(
            "Prompt listo para generar este plano con IA (Veo/Sora/Runway). " +
            "Solo para shot_type voiceover_broll o broll_only que sean generables con IA. " +
            "null si es talking_head o si el broll debe grabarse en real."
          ),
        seconds: z.number().describe("Duración aproximada del plano"),
      })
    )
    .min(1),
  pacing: z.string().describe("Ritmo general (rápido/medio) y por qué"),
  total_seconds: z.number().describe("Duración total objetivo"),
  broll: z.array(z.string()).describe("Recursos / b-roll sugeridos (descripción humana)"),
  lut: z
    .string()
    .describe(
      "LUT / grade de color para todo el vídeo (ej. 'teal & orange, contraste alto, sombras frías'). Coherente con el feed del usuario."
    ),
  graphics: z
    .array(
      z.object({
        type: z
          .enum(["lower_third", "title_card", "overlay_text", "cta_badge"])
          .describe("Tipo de gráfico"),
        content: z.string().describe("Texto o descripción del gráfico"),
        timing: z
          .string()
          .describe("Cuándo aparece y cuánto dura (ej. 's5–s9, 4s')"),
        style: z
          .string()
          .describe("Color, fuente, animación (ej. 'fondo #3FE0A2, texto negro, slide-in desde abajo')"),
      })
    )
    .describe(
      "Lower thirds, title cards, badges CTA y overlays de texto con timing y estilo. Array vacío si no hay gráficos."
    ),
  format_notes: z.string().describe("Formato (Reel/Short/TikTok), notas de montaje"),
});
export type VideoBrief = z.infer<typeof VideoBriefSchema>;

// ── Fase 3 · Audio Director ───────────────────────────────────
export const AudioBriefSchema = z.object({
  voiceover: z.string().describe("Guion de locución (VO) listo para grabar"),
  voice_tone: z.string().describe("Tono/voz: género, energía, acento, ritmo"),
  music: z.string().describe("Estilo/mood de la música de fondo"),
  sfx: z.array(z.string()).describe("Efectos de sonido sugeridos por momento"),
});
export type AudioBrief = z.infer<typeof AudioBriefSchema>;

// ── Fase 3 · Music Brief (solo content_type === "music") ──────
export const MusicBriefSchema = z.object({
  mood: z.string().describe("Atmósfera/emoción de la pieza musical"),
  tempo: z.string().describe("Tempo o energía (lento/medio/rápido, BPM si aplica)"),
  reference: z.string().nullable().describe("Referencia de estilo (sin copyright)"),
  lyrics: z.string().nullable().describe("Letra o estribillo si aplica, o null"),
});
export type MusicBrief = z.infer<typeof MusicBriefSchema>;

// ── Fase 3 · Orchestrator (juez de competición) ───────────────
// Cuando un grupo compite (dos modelos hacen la MISMA tarea), el orquestador
// hace de juez y elige el mejor. No reescribe: solo dictamina.
export const JudgeVerdictSchema = z.object({
  winner: z
    .enum(["A", "B"])
    .describe("Qué candidato gana: 'A' (preferido del usuario) o 'B' (rival)"),
  why: z.string().describe("Una frase: por qué gana ese, según los criterios"),
});
export type JudgeVerdict = z.infer<typeof JudgeVerdictSchema>;

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
  // Taxonomía: tipo de pieza (qué se produjo) e intención editorial.
  content_type: string;
  content_category: string;
  script: string;
  caption: string;
  hashtags: string[];
  cta: string;
  image_prompt: string;
  video_prompt: string | null;
  aspect_ratio: string | null;
  cover_description: string | null;
  // Para carruseles: un image_prompt por slide (mismo orden que slides[]).
  slide_image_prompts: string[] | null;
  // Dirección de vídeo y de audio (null si el grupo no produjo o falló).
  video_brief: VideoBrief | null;
  audio_brief: AudioBrief | null;
  // Slides del carrusel (content_type "carousel"); null en otros tipos.
  slides: Slide[] | null;
  // Brief musical (content_type "music"); null en otros tipos.
  music_brief: MusicBrief | null;
  // Resumen de piezas (content_type "mixed"); null en otros tipos.
  pieces:
    | Array<{ type: string; platform: string; summary: string }>
    | null;
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
