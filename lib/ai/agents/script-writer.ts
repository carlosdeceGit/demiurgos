import { SCRIPT_WRITER_PROMPT } from "@/lib/ai/agents/prompts";
import { runObjectAgent } from "@/lib/ai/agents/run-object";
import {
  ScriptSchema,
  type Idea,
  type Script,
} from "@/lib/ai/agents/schemas";

export function buildScriptPrompt(idea: Idea): string {
  return [
    "Idea seleccionada a desarrollar:",
    "```json",
    JSON.stringify(idea, null, 2),
    "```",
    "Escribe el guión completo y el copy según tus reglas y la voz del perfil.",
  ].join("\n");
}

export async function runScriptWriter(args: {
  modelId: string;
  systemContext: string;
  idea: Idea;
}): Promise<{ script: Script; tokens: number | null; model: string }> {
  const { object, tokens, model } = await runObjectAgent({
    modelId: args.modelId,
    systemContext: args.systemContext,
    rolePrompt: SCRIPT_WRITER_PROMPT,
    prompt: buildScriptPrompt(args.idea),
    schema: ScriptSchema,
    schemaName: "Script",
  });
  return { script: object, tokens, model };
}
