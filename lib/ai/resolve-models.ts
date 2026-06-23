import {
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
    imageDirector: effectiveModel("image", prefs),
  };
}
