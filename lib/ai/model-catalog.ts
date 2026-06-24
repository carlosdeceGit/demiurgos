// Catálogo de IA por GRUPO DE TAREA. La idea (decisión de producto):
//  - Opus 4.8 es el ORQUESTADOR: analiza la petición, la trocea en tareas y
//    manda prompts precisos a cada subagente.
//  - Los subagentes no tienen por qué ser los modelos top: cada grupo de tarea
//    ofrece varias opciones (calidad/precio) y cada usuario elige la suya.
//
// Los `id` son slugs del Vercel AI Gateway (creador/modelo). El precio es
// orientativo ($ por millón de tokens, entrada/salida); confírmalo en tu gateway.
// El campo es libre con sugerencias: si tu gateway expone otro slug, vale igual.
// Si un modelo elegido no enruta, el pipeline DEGRADA ese subagente (no peta).

export type TaskGroupId =
  | "orchestrator"
  | "text"
  | "web"
  | "image"
  | "video"
  | "audio"
  | "code";

export type ModelOption = {
  id: string; // slug del gateway
  label: string;
  pricing: string; // orientativo
};

export type TaskGroup = {
  id: TaskGroupId;
  label: string;
  description: string;
  defaultModel: string;
  options: ModelOption[];
  // El ORQUESTADOR puede repartir esta tarea a DOS modelos a la vez y quedarse
  // con el mejor resultado (modo "competición"): declara la capacidad aquí, el
  // 2.º aspirante por defecto es `competeWith` y el orquestador hace de juez.
  // Ver lib/ai/ARCHITECTURE.md §"Competición de modelos". CABLEADO para "text"
  // (orchestrator.ts → runScriptStage); para "video" es declaración (su grupo
  // aún no se ejecuta en el pipeline). Sin esto, el grupo resuelve a UN modelo.
  competition?: boolean;
  competeWith?: string; // slug del 2.º aspirante por defecto
};

export const TASK_GROUPS: TaskGroup[] = [
  {
    id: "orchestrator",
    label: "Orquestador (razonamiento)",
    description:
      "Analiza tu petición, la trocea en tareas y coordina al resto. Aquí conviene el modelo más capaz.",
    defaultModel: "anthropic/claude-opus-4.8",
    options: [
      { id: "anthropic/claude-opus-4.8", label: "Claude Opus 4.8", pricing: "$5 / $25" },
      { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", pricing: "$3 / $15" },
      { id: "google/gemini-3.1-pro", label: "Gemini 3.1 Pro", pricing: "≈$1.25 / $5" },
      { id: "deepseek/deepseek-r1", label: "DeepSeek R1 (razonamiento)", pricing: "≈$0.55 / $2.2" },
    ],
  },
  {
    id: "text",
    label: "Texto (ideas y guiones)",
    description:
      "El grueso del trabajo: generar ideas y redactar guiones/copys. No necesita el modelo top. Admite COMPETICIÓN: el orquestador puede pedir el guion a dos modelos a la vez y quedarse con el mejor.",
    defaultModel: "anthropic/claude-haiku-4.5",
    competition: true,
    competeWith: "google/gemini-2.5-flash",
    options: [
      { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", pricing: "$1 / $5" },
      { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", pricing: "≈$0.30 / $2.5" },
      { id: "deepseek/deepseek-v3", label: "DeepSeek V3", pricing: "≈$0.30 / $1.2" },
      { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6 (más calidad)", pricing: "$3 / $15" },
    ],
  },
  {
    id: "web",
    label: "Web / búsqueda (tendencias)",
    description:
      "Analiza la semana del nicho y las tendencias. Gemini va bien con búsqueda.",
    defaultModel: "google/gemini-3.1-pro",
    options: [
      { id: "google/gemini-3.1-pro", label: "Gemini 3.1 Pro", pricing: "≈$1.25 / $5" },
      { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", pricing: "≈$0.30 / $2.5" },
      { id: "openai/gpt-4.1", label: "GPT-4.1", pricing: "≈$2 / $8" },
      { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", pricing: "$3 / $15" },
    ],
  },
  {
    id: "image",
    label: "Imágenes (dirección visual)",
    description:
      "Define el estilo y el prompt de imagen/vídeo de cada pieza. Gemini recomendado.",
    defaultModel: "google/gemini-3.1-pro",
    options: [
      { id: "google/gemini-3.1-pro", label: "Gemini 3.1 Pro (visión)", pricing: "≈$1.25 / $5" },
      { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6 (visión)", pricing: "$3 / $15" },
      { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", pricing: "≈$0.30 / $2.5" },
    ],
  },
  {
    id: "video",
    label: "Vídeo (dirección y montaje)",
    description:
      "Convierte cada guion en un brief de vídeo: plano a plano, ritmo, duración, formato (Reel/Short/TikTok), b-roll y texto en pantalla. La generación del vídeo en sí (Veo/Sora/Runway) es un motor enchufable a futuro; hoy se produce la dirección. Admite COMPETICIÓN.",
    defaultModel: "google/gemini-3.1-pro",
    competition: true,
    competeWith: "anthropic/claude-sonnet-4.6",
    options: [
      { id: "google/gemini-3.1-pro", label: "Gemini 3.1 Pro (visión/vídeo)", pricing: "≈$1.25 / $5" },
      { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6 (visión)", pricing: "$3 / $15" },
      { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", pricing: "≈$0.30 / $2.5" },
      { id: "google/veo-3", label: "Veo 3 (generación, futuro)", pricing: "por segundo" },
      { id: "openai/sora-2", label: "Sora 2 (generación, futuro)", pricing: "por segundo" },
    ],
  },
  {
    id: "audio",
    label: "Audio (voz, locución y música)",
    description:
      "Escribe el guion de locución (VO), elige tono/voz y sugiere música/SFX por escena. La síntesis de voz (TTS) y la música son motores enchufables a futuro; hoy se produce el guion de audio.",
    defaultModel: "anthropic/claude-haiku-4.5",
    options: [
      { id: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5 (guion de voz)", pricing: "$1 / $5" },
      { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", pricing: "≈$0.30 / $2.5" },
      { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6 (más calidad)", pricing: "$3 / $15" },
      { id: "elevenlabs/tts-v3", label: "ElevenLabs TTS (síntesis, futuro)", pricing: "por carácter" },
    ],
  },
  {
    id: "code",
    label: "Código (reservado)",
    description:
      "Para tareas de código. Aún no se usa en el calendario; queda listo para el futuro.",
    defaultModel: "anthropic/claude-sonnet-4.6",
    options: [
      { id: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", pricing: "$3 / $15" },
      { id: "deepseek/deepseek-v3", label: "DeepSeek V3", pricing: "≈$0.30 / $1.2" },
      { id: "openai/gpt-4.1", label: "GPT-4.1", pricing: "≈$2 / $8" },
    ],
  },
];

export const TASK_GROUP_IDS = TASK_GROUPS.map((g) => g.id);

export function catalogDefault(group: TaskGroupId): string {
  return TASK_GROUPS.find((g) => g.id === group)!.defaultModel;
}

// 2.º aspirante por defecto de un grupo en COMPETICIÓN (o null si no compite).
export function catalogCompetitor(group: TaskGroupId): string | null {
  const g = TASK_GROUPS.find((x) => x.id === group);
  return g?.competition ? (g.competeWith ?? null) : null;
}
