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

  const {
    messages,
    conversationId,
  }: { messages: UIMessage[]; conversationId?: string } = await req.json();

  // Resolver o crear la conversación
  let convId = conversationId ?? null;
  if (!convId) {
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    convId = conv?.id ?? null;
  }

  // Componer el contexto del usuario.
  const context = await gatherContext(supabase, user.id);
  const systemContext = composeSystemPrompt(context);

  // Persistir el mensaje nuevo del usuario.
  const userText = textOf(messages[messages.length - 1]);
  if (userText && convId) {
    // Título automático: primeras 60 chars del primer mensaje
    const isFirst = messages.length === 1;
    if (isFirst) {
      await supabase
        .from("conversations")
        .update({ title: userText.slice(0, 60), last_message_at: new Date().toISOString() })
        .eq("id", convId);
    } else {
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", convId);
    }

    await supabase.from("messages").insert({
      user_id: user.id,
      role: "user",
      content: userText,
      conversation_id: convId,
    });
  }

  // Llamar al Director y persistir al terminar.
  const { directorModel } = await getModelSettings();
  const result = await runDirector({
    systemContext,
    modelId: directorModel,
    messages: await convertToModelMessages(messages),
    onFinish: async (text) => {
      if (text && convId) {
        await supabase.from("messages").insert({
          user_id: user.id,
          role: "assistant",
          content: text,
          conversation_id: convId,
        });
        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", convId);
      }
    },
  });

  // Devolver el conversation_id en headers para que el cliente lo capture
  const response = result.toUIMessageStreamResponse();
  const headers = new Headers(response.headers);
  if (convId) headers.set("X-Conversation-Id", convId);

  return new Response(response.body, { status: response.status, headers });
}
