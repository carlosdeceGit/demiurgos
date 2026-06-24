import { VIDEO_DIRECTOR_PROMPT } from "@/lib/ai/agents/prompts";
import { runObjectAgent } from "@/lib/ai/agents/run-object";
import {
  VideoBriefSchema,
  type Idea,
  type VideoBrief,
} from "@/lib/ai/agents/schemas";

export function buildVideoDirectorPrompt(idea: Idea): string {
  return [
    "Idea para la que diriges el vídeo:",
    "```json",
    JSON.stringify(idea, null, 2),
    "```",
    "Produce la dirección de vídeo: planos, ritmo, duración, b-roll y formato.",
  ].join("\n");
}

export async function runVideoDirector(args: {
  modelId: string;
  systemContext: string;
  idea: Idea;
}): Promise<{ brief: VideoBrief; tokens: number | null; model: string }> {
  const { object, tokens, model } = await runObjectAgent({
    modelId: args.modelId,
    systemContext: args.systemContext,
    rolePrompt: VIDEO_DIRECTOR_PROMPT,
    prompt: buildVideoDirectorPrompt(args.idea),
    schema: VideoBriefSchema,
    schemaName: "VideoBrief",
  });
  return { brief: object, tokens, model };
}
