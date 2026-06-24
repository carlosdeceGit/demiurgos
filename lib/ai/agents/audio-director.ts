import { AUDIO_DIRECTOR_PROMPT } from "@/lib/ai/agents/prompts";
import { runObjectAgent } from "@/lib/ai/agents/run-object";
import {
  AudioBriefSchema,
  type AudioBrief,
  type Idea,
} from "@/lib/ai/agents/schemas";

export function buildAudioDirectorPrompt(idea: Idea): string {
  return [
    "Idea para la que diriges el audio:",
    "```json",
    JSON.stringify(idea, null, 2),
    "```",
    "Produce el guion de audio: locución (VO), tono de voz, música y SFX.",
  ].join("\n");
}

export async function runAudioDirector(args: {
  modelId: string;
  systemContext: string;
  idea: Idea;
}): Promise<{ brief: AudioBrief; tokens: number | null; model: string }> {
  const { object, tokens, model } = await runObjectAgent({
    modelId: args.modelId,
    systemContext: args.systemContext,
    rolePrompt: AUDIO_DIRECTOR_PROMPT,
    prompt: buildAudioDirectorPrompt(args.idea),
    schema: AudioBriefSchema,
    schemaName: "AudioBrief",
  });
  return { brief: object, tokens, model };
}
