import { createGateway } from "@ai-sdk/gateway";

// Capa de IA model-agnostic: una sola key (Vercel AI Gateway) para todos los
// proveedores, con fallbacks. Cambiar de modelo es cambiar un string de entorno.
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// Modelos del consejo, configurables por entorno. En el Hito 1 solo se usa el
// Director. Crítico y Analista quedan documentados para hitos posteriores.
export const MODELS = {
  // Defaults de fallback (si fallara la lectura de settings en BD). Se eligen
  // ids que la documentación de Vercel AI Gateway usa como válidos.
  director: process.env.DIRECTOR_MODEL ?? "anthropic/claude-opus-4.7",
  critic: process.env.CRITIC_MODEL ?? "anthropic/claude-opus-4.7",
  analyst: process.env.ANALYST_MODEL ?? "google/gemini-2.5-pro",
  demo: process.env.DEMO_MODEL ?? "anthropic/claude-opus-4.7",
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
