import { IMAGE_DIRECTOR_PROMPT } from "@/lib/ai/agents/prompts";
import { runObjectAgent } from "@/lib/ai/agents/run-object";
import {
  ImageBriefSchema,
  type Idea,
  type ImageBrief,
} from "@/lib/ai/agents/schemas";

export function buildImageDirectorPrompt(idea: Idea): string {
  return [
    "Idea para la que diriges el visual:",
    "```json",
    JSON.stringify(idea, null, 2),
    "```",
    "Produce el brief visual (prompt de imagen, vídeo si aplica, portada, ratio).",
  ].join("\n");
}

export async function runImageDirector(args: {
  modelId: string;
  systemContext: string;
  idea: Idea;
}): Promise<{ brief: ImageBrief; tokens: number | null; model: string }> {
  const { object, tokens, model } = await runObjectAgent({
    modelId: args.modelId,
    systemContext: args.systemContext,
    rolePrompt: IMAGE_DIRECTOR_PROMPT,
    prompt: buildImageDirectorPrompt(args.idea),
    schema: ImageBriefSchema,
    schemaName: "ImageBrief",
  });
  return { brief: object, tokens, model };
}
