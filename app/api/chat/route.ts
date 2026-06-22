import { convertToModelMessages, type UIMessage } from "ai";

import { createClient } from "@/lib/db/server";
import {
  composeSystemPrompt,
  gatherContext,
} from "@/lib/ai/compose-context";
import { runDirector } from "@/lib/ai/roles/director";
import { getModelSettings } from "@/lib/db/settings";

export const maxDuration = 60;

function textOf(message: UIMessage | undefined): string {
  if (!message) return "";
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
    .trim();
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autenticado", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  // 1. Componer el contexto a partir de lo ya persistido (sin el turno actual).
  const context = await gatherContext(supabase, user.id);
  const systemContext = composeSystemPrompt(context);

  // 2. Persistir el mensaje nuevo del usuario.
  const userText = textOf(messages[messages.length - 1]);
  if (userText) {
    await supabase
      .from("messages")
      .insert({ user_id: user.id, role: "user", content: userText });
  }

  // 3. Llamar al Director (modelo elegido en el admin) y persistir al terminar.
  const { directorModel } = await getModelSettings();
  const result = await runDirector({
    systemContext,
    modelId: directorModel,
    messages: await convertToModelMessages(messages),
    onFinish: async (text) => {
      if (text) {
        await supabase
          .from("messages")
          .insert({ user_id: user.id, role: "assistant", content: text });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
