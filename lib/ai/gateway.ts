import { createGateway } from "@ai-sdk/gateway";

// Capa de IA model-agnostic: una sola key (Vercel AI Gateway) para todos los
// proveedores, con fallbacks. Cambiar de modelo es cambiar un string de entorno.
const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// Modelos del consejo, configurables por entorno. En el Hito 1 solo se usa el
// Director. Crítico y Analista quedan documentados para hitos posteriores.
export const MODELS = {
  director: process.env.DIRECTOR_MODEL ?? "openai/gpt-5.5",
  critic: process.env.CRITIC_MODEL ?? "anthropic/claude-opus-4.8",
  analyst: process.env.ANALYST_MODEL ?? "google/gemini-3.1-pro",
  // Modelo del chat de la demo pública. Por defecto, uno más barato que el
  // Director para acotar coste (configurable por entorno).
  demo: process.env.DEMO_MODEL ?? "google/gemini-3.1-pro",
} as const;

export function directorModel() {
  return gateway(MODELS.director);
}

export function demoModel() {
  return gateway(MODELS.demo);
}
