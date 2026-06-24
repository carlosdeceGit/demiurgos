import {
  catalogCompetesByDefault,
  catalogCompetitor,
  catalogDefault,
  getTaskGroup,
  TASK_GROUP_IDS,
  type TaskGroupId,
} from "@/lib/ai/model-catalog";
import type { OrchestratorModels } from "@/lib/ai/orchestrator";

// Preferencias de IA de un usuario. Dos mapas por grupo de tarea:
//  - models[group]      = modelo PRINCIPAL (cualquier slug del gateway).
//  - competitors[group] = 2.º modelo para COMPETICIÓN. Tokens especiales:
//        "off"  → competición desactivada para ese grupo.
//        "auto" → activada con el rival recomendado del catálogo.
//        "<slug>" → activada contra ese modelo concreto (cualquiera del gateway).
//        ausente → sin configurar: se usa el comportamiento por defecto del grupo.
export type UserModelPreferences = {
  models: Partial<Record<TaskGroupId, string>>;
  competitors: Partial<Record<TaskGroupId, string>>;
};

export const COMPETE_OFF = "off";
export const COMPETE_AUTO = "auto";

function emptyPrefs(): UserModelPreferences {
  return { models: {}, competitors: {} };
}

// Limpia un objeto arbitrario (lo que venga de la BD) a preferencias válidas.
// Acepta el formato nuevo ({models,competitors}) y el LEGADO (mapa plano
// grupo→slug, que se interpreta como los modelos principales).
export function sanitizePreferences(raw: unknown): UserModelPreferences {
  if (!raw || typeof raw !== "object") return emptyPrefs();
  const obj = raw as Record<string, unknown>;
  const out = emptyPrefs();

  const hasNewShape =
    typeof obj.models === "object" || typeof obj.competitors === "object";
  const modelsSrc = (hasNewShape ? obj.models : obj) as
    | Record<string, unknown>
    | undefined;
  const competitorsSrc = (
    hasNewShape ? obj.competitors : undefined
  ) as Record<string, unknown> | undefined;

  for (const id of TASK_GROUP_IDS) {
    const m = modelsSrc?.[id];
    if (typeof m === "string" && m.trim()) out.models[id] = m.trim();
    const c = competitorsSrc?.[id];
    if (typeof c === "string" && c.trim()) out.competitors[id] = c.trim();
  }
  return out;
}

// Modelo efectivo de un grupo: elección del usuario → default del catálogo.
export function effectiveModel(
  group: TaskGroupId,
  prefs: UserModelPreferences
): string {
  const chosen = prefs.models[group];
  return chosen && chosen.trim() ? chosen.trim() : catalogDefault(group);
}

// Rival recomendado del grupo, GARANTIZADO distinto al modelo principal:
// competeWith del catálogo → default del catálogo → 1.ª opción distinta → null.
function recommendedCompetitor(
  group: TaskGroupId,
  primary: string
): string | null {
  const candidates = [
    catalogCompetitor(group),
    catalogDefault(group),
    ...(getTaskGroup(group)?.options.map((o) => o.id) ?? []),
  ];
  for (const c of candidates) {
    if (c && c !== primary) return c;
  }
  return null;
}

// 2.º contendiente efectivo del grupo (o null si no compite). Respeta la
// elección del usuario (off / auto / slug) y, si no configuró nada, el default
// del grupo. NUNCA devuelve el mismo modelo que el principal.
export function competitorModel(
  group: TaskGroupId,
  prefs: UserModelPreferences
): string | null {
  const primary = effectiveModel(group, prefs);
  const pref = prefs.competitors[group];

  if (pref === undefined) {
    // Sin configurar: compite solo si el grupo compite por defecto.
    return catalogCompetesByDefault(group)
      ? recommendedCompetitor(group, primary)
      : null;
  }
  if (pref === COMPETE_OFF) return null;
  if (pref === COMPETE_AUTO || pref === "") {
    return recommendedCompetitor(group, primary);
  }
  const slug = pref.trim();
  // Un slug propio; si coincide con el principal no tiene sentido, cae al rival.
  return slug && slug !== primary ? slug : recommendedCompetitor(group, primary);
}

// Traduce los grupos de tarea a los roles concretos del pipeline del calendario.
// (idea y guión comparten el grupo "text"; tendencias = "web"; etc.)
// Cada productor por pieza lleva su 2.º modelo de competición (null = sin compe).
export function resolvePipelineModels(
  prefs: UserModelPreferences
): OrchestratorModels {
  return {
    orchestrator: effectiveModel("orchestrator", prefs),
    trend: effectiveModel("web", prefs),
    idea: effectiveModel("text", prefs),
    script: effectiveModel("text", prefs),
    scriptCompetitor: competitorModel("text", prefs),
    imageDirector: effectiveModel("image", prefs),
    imageCompetitor: competitorModel("image", prefs),
    video: effectiveModel("video", prefs),
    videoCompetitor: competitorModel("video", prefs),
    audio: effectiveModel("audio", prefs),
    audioCompetitor: competitorModel("audio", prefs),
  };
}
