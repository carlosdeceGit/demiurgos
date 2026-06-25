import { createGateway } from "@ai-sdk/gateway";

// Capa de IA model-agnostic: una sola key (Vercel AI Gateway) para todos los
// proveedores, con fallbacks. Cambiar de modelo es cambiar un string de entorno
// (o, mejor, un valor en la tabla settings desde /admin, sin redeploy).
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// Modelos por rol, configurables por entorno. Son los DEFAULTS de fallback:
// la tabla settings (BD) manda en runtime (ver lib/db/settings.ts).
//
// Nota sobre la elección de modelos (junio 2026):
//  - El orquestador usa Opus 4.8: top de la familia Opus al mismo precio que
//    4.6/4.7 ($5/$25). El doc original pedía 4.6 por un ranking de Arena; 4.8 es
//    el sucesor directo y mejor opción por defecto. Cámbialo en /admin si quieres.
//  - Los ids son slugs del gateway (creador/modelo). Si tu gateway expone otro
//    slug, ponlo en /admin o en la env correspondiente.
export const MODELS = {
  // Chat (Director) y demo — ya existían.
  director: process.env.DIRECTOR_MODEL ?? "anthropic/claude-opus-4.8",
  critic: process.env.CRITIC_MODEL ?? "anthropic/claude-opus-4.8",
  analyst: process.env.ANALYST_MODEL ?? "google/gemini-3.1-pro-preview",
  demo: process.env.DEMO_MODEL ?? "anthropic/claude-opus-4.8",

  // Orquestador multi-agente (calendario semanal).
  orchestrator:
    process.env.ORCHESTRATOR_MODEL ?? "anthropic/claude-opus-4.8",
  trend: process.env.TREND_MODEL ?? "google/gemini-3.1-pro-preview",
  idea: process.env.IDEA_MODEL ?? "anthropic/claude-haiku-4.5",
  script: process.env.SCRIPT_MODEL ?? "anthropic/claude-sonnet-4.6",
  imageDirector:
    process.env.IMAGE_DIRECTOR_MODEL ?? "anthropic/claude-sonnet-4.6",
} as const;

export function directorModel() {
  return gateway(MODELS.director);
}

export function demoModel() {
  return gateway(MODELS.demo);
}

// Resuelve un modelo por su id del gateway (p. ej. "openai/gpt-4.1").
export function gatewayModel(id: string) {
  return gateway(id);
}
