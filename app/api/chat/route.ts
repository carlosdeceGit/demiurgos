import { convertToModelMessages, type UIMessage } from "ai";

import { createClient } from "@/lib/db/server";
import {
  composeSystemPrompt,
  gatherContext,
} from "@/lib/ai/compose-context";
import { runDirector } from "@/lib/ai/roles/director";
import { getModelSettings } from "@/lib/db/settings";

export const maxDuration = 60;

const ACTIVE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 horas

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

  const { messages }: { messages: UIMessage[] } = await req.json();
  const userText = textOf(messages[messages.length - 1]);

  // 1. Buscar conversación activa reciente (no archivada, actualizada en las últimas 2h).
  const since = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString();
  const { data: active } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .gte("updated_at", since)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversationId: string | null = active?.id ?? null;

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
      .eq("id", conversationId);
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

  return result.toUIMessageStreamResponse();
}
