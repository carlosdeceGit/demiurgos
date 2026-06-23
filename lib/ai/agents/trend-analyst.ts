import { TREND_ANALYST_PROMPT } from "@/lib/ai/agents/prompts";
import { runObjectAgent } from "@/lib/ai/agents/run-object";
import { TrendReportSchema, type TrendReport } from "@/lib/ai/agents/schemas";

export function buildTrendPrompt(platforms: string[], dateISO: string): string {
  return [
    `Fecha de referencia: ${dateISO}.`,
    `Plataformas activas del usuario: ${
      platforms.length ? platforms.join(", ") : "(no declaradas)"
    }.`,
    "Analiza la semana del nicho de este usuario concreto y devuelve el informe.",
  ].join("\n");
}

export async function runTrendAnalyst(args: {
  modelId: string;
  systemContext: string;
  platforms: string[];
  dateISO: string;
}): Promise<{ report: TrendReport; tokens: number | null; model: string }> {
  const { object, tokens, model } = await runObjectAgent({
    modelId: args.modelId,
    systemContext: args.systemContext,
    rolePrompt: TREND_ANALYST_PROMPT,
    prompt: buildTrendPrompt(args.platforms, args.dateISO),
    schema: TrendReportSchema,
    schemaName: "TrendReport",
  });
  return { report: object, tokens, model };
}
