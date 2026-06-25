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

function titleFrom(text: string): string {
  return text.slice(0, 60).replace(/\n/g, " ").trim();
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autenticado", { status: 401 });
  }

  const {
    messages,
    conversationId: incomingConvId,
  }: { messages: UIMessage[]; conversationId?: string } = await req.json();

  // 1. Resolver conversación: recuperar existente o crear nueva.
  let conversationId = incomingConvId ?? null;
  const userText = textOf(messages[messages.length - 1]);

  if (!conversationId) {
    const { data: conv } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title: userText ? titleFrom(userText) : "Nueva conversación",
      })
      .select("id")
      .single();
    conversationId = conv?.id ?? null;
  } else {
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", user.id);
  }

  // 2. Componer el contexto.
  const context = await gatherContext(supabase, user.id);
  const systemContext = composeSystemPrompt(context);

  // 3. Persistir el mensaje del usuario.
  if (userText) {
    await supabase.from("messages").insert({
      user_id: user.id,
      role: "user",
      content: userText,
      conversation_id: conversationId,
    });
  }

  // 4. Llamar al Director y persistir la respuesta.
  const { directorModel } = await getModelSettings();
  const result = await runDirector({
    systemContext,
    modelId: directorModel,
    messages: await convertToModelMessages(messages),
    onFinish: async (text) => {
      if (text) {
        await supabase.from("messages").insert({
          user_id: user.id,
          role: "assistant",
          content: text,
          conversation_id: conversationId,
        });
      }
    },
  });

  return result.toUIMessageStreamResponse({
    headers: conversationId
      ? { "X-Conversation-Id": conversationId }
      : undefined,
  });
}
