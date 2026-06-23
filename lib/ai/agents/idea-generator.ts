import { IDEA_GENERATOR_PROMPT } from "@/lib/ai/agents/prompts";
import { runObjectAgent } from "@/lib/ai/agents/run-object";
import {
  IdeaListSchema,
  type IdeaList,
  type TrendReport,
} from "@/lib/ai/agents/schemas";

export function buildIdeaPrompt(trends: TrendReport): string {
  return [
    "Informe de tendencias de esta semana (úsalo para anclar las ideas):",
    "```json",
    JSON.stringify(trends, null, 2),
    "```",
    "Genera el lote de ideas (entre 18 y 25) según tus reglas.",
  ].join("\n");
}

export async function runIdeaGenerator(args: {
  modelId: string;
  systemContext: string;
  trends: TrendReport;
}): Promise<{ list: IdeaList; tokens: number | null; model: string }> {
  const { object, tokens, model } = await runObjectAgent({
    modelId: args.modelId,
    systemContext: args.systemContext,
    rolePrompt: IDEA_GENERATOR_PROMPT,
    prompt: buildIdeaPrompt(args.trends),
    schema: IdeaListSchema,
    schemaName: "IdeaList",
  });
  return { list: object, tokens, model };
}
