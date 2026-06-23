import { generateObject } from "ai";
import type { z } from "zod";

import { gatewayModel } from "@/lib/ai/gateway";

export type AgentRunResult<T> = {
  object: T;
  tokens: number | null;
  model: string;
};

// Ejecuta un agente tipado: system = contexto compuesto + directiva de rol.
// Devuelve el objeto validado por Zod más los tokens usados (para ai_runs).
// generateObject ya valida contra el esquema; si el modelo se desvía, lanza.
export async function runObjectAgent<T>({
  modelId,
  systemContext,
  rolePrompt,
  prompt,
  schema,
  schemaName,
}: {
  modelId: string;
  systemContext: string;
  rolePrompt: string;
  prompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
}): Promise<AgentRunResult<T>> {
  const system = `${systemContext}\n\n# ROL ACTIVO\n${rolePrompt.trim()}`;

  const { object, usage } = await generateObject({
    model: gatewayModel(modelId),
    schema,
    schemaName,
    system,
    prompt,
  });

  return {
    object: object as T,
    tokens: usage?.totalTokens ?? null,
    model: modelId,
  };
}
