// Punto de entrada de los datos de demostración (fixtures).
// Datos FALSOS e ilustrativos para /demo y el panel admin de muestra.
// No tocan la base de datos real.

export * from "./types";
export {
  DEMO_PROFILES,
  DEFAULT_DEMO_PROFILE_ID,
  getDemoProfile,
} from "./profiles";
export {
  DEMO_PROPOSALS,
  DEMO_SIGNALS,
  DEMO_CONVERSATIONS,
  proposalsFor,
  signalsFor,
  conversationFor,
} from "./content";
export {
  DEMO_AI_RUNS,
  totalCost,
  totalTokens,
  costByModel,
  costByDay,
  usageByUser,
} from "./metrics";

import { DEMO_PROFILES } from "./profiles";
import { DEMO_PROPOSALS, DEMO_SIGNALS } from "./content";
import { totalCost, totalTokens } from "./metrics";

// Resumen para el panel admin (KPIs de la cabecera).
export function demoAdminSummary() {
  return {
    users: DEMO_PROFILES.length,
    onboardingCompleted: DEMO_PROFILES.filter((p) => p.onboardingCompleted)
      .length,
    proposals: DEMO_PROPOSALS.length,
    signals: DEMO_SIGNALS.length,
    aiCost: totalCost(),
    aiTokens: totalTokens(),
  };
}
