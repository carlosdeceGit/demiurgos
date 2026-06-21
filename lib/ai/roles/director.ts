import { promises as fs } from "node:fs";
import path from "node:path";

import { streamText, type ModelMessage } from "ai";

import { directorModel } from "@/lib/ai/gateway";

async function loadDirectorPrompt(): Promise<string> {
  const promptPath = path.join(process.cwd(), "prompts", "director.md");
  return fs.readFile(promptPath, "utf8");
}

// Ejecuta el rol Director: motor + contexto (system) + la directiva de rol,
// sobre el hilo de mensajes del usuario. Devuelve el stream de streamText.
export async function runDirector({
  systemContext,
  messages,
  onFinish,
}: {
  systemContext: string;
  messages: ModelMessage[];
  onFinish?: (text: string) => void | Promise<void>;
}) {
  const role = await loadDirectorPrompt();
  const system = `${systemContext}\n\n# ROL ACTIVO\n${role.trim()}`;

  return streamText({
    model: directorModel(),
    system,
    messages,
    onFinish: onFinish
      ? async ({ text }) => {
          await onFinish(text);
        }
      : undefined,
  });
}
