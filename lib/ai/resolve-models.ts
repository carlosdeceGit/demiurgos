import {
  catalogCompetitor,
  catalogDefault,
  TASK_GROUP_IDS,
  type TaskGroupId,
} from "@/lib/ai/model-catalog";
import type { OrchestratorModels } from "@/lib/ai/orchestrator";

// Preferencias de IA de un usuario: un slug por grupo de tarea (todas opcionales).
export type UserModelPreferences = Partial<Record<TaskGroupId, string>>;

// Limpia un objeto arbitrario (lo que venga de la BD) a preferencias válidas.
export function sanitizePreferences(raw: unknown): UserModelPreferences {
  if (!raw || typeof raw !== "object") return {};
  const out: UserModelPreferences = {};
  for (const id of TASK_GROUP_IDS) {
    const v = (raw as Record<string, unknown>)[id];
    if (typeof v === "string" && v.trim()) out[id] = v.trim();
  }
  return out;
}

// Modelo efectivo de un grupo: elección del usuario → default del catálogo.
export function effectiveModel(
  group: TaskGroupId,
  prefs: UserModelPreferences
): string {
  const chosen = prefs[group];
  return chosen && chosen.trim() ? chosen.trim() : catalogDefault(group);
}

// 2.º contendiente del grupo "text" cuando compite, SIEMPRE distinto al elegido
// por el usuario. Si el rival por defecto coincide con su elección, cae al
// default del catálogo; si también coincide, no hay competición (null).
export function competitorModel(
  group: TaskGroupId,
  prefs: UserModelPreferences
): string | null {
  const rival = catalogCompetitor(group);
  if (!rival) return null;
  const chosen = effectiveModel(group, prefs);
  if (rival !== chosen) return rival;
  const fallback = catalogDefault(group);
  return fallback !== chosen ? fallback : null;
}

// Traduce los grupos de tarea a los roles concretos del pipeline del calendario.
// (idea y guión comparten el grupo "text"; tendencias = "web"; etc.)
export function resolvePipelineModels(
  prefs: UserModelPreferences
): OrchestratorModels {
  return {
    orchestrator: effectiveModel("orchestrator", prefs),
    trend: effectiveModel("web", prefs),
    idea: effectiveModel("text", prefs),
    script: effectiveModel("text", prefs),
    // Competición del grupo "texto": el guión se encarga a dos modelos y el
    // orquestador hace de juez (ver orchestrator.ts). null = sin competición.
    scriptCompetitor: competitorModel("text", prefs),
    imageDirector: effectiveModel("image", prefs),
  };
}
