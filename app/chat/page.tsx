import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { ChatClient } from "@/components/chat/chat-client";
import { ChatShell } from "@/components/chat/chat-shell";
import { activePlatformKeys, type ProfilePlatform } from "@/lib/ai/platforms";
import { isAdminEmail } from "@/lib/auth/admin";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>;
}) {
  const { conv } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, positioning, platforms")
    .eq("user_id", user.id)
    .maybeSingle();

  const platforms = activePlatformKeys(
    (profile?.platforms as ProfilePlatform[] | null) ?? null
  );

  const positioning =
    (profile?.positioning as { declaracion?: string } | null)?.declaracion ?? null;

  const { data: signals } = await supabase
    .from("signals")
    .select("content, source")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Cargar historial de conversaciones para el sidebar
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, title, last_message_at")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false })
    .limit(30);

  // Si hay una conversación activa, cargar sus mensajes
  let initialMessages: { id: string; role: string; content: string }[] = [];
  if (conv) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, role, content")
      .eq("conversation_id", conv)
      .order("created_at", { ascending: true });
    initialMessages = msgs ?? [];
  }

  return (
    <ChatShell
      email={user.email ?? ""}
      displayName={profile?.display_name ?? user.email ?? "Tú"}
      positioning={positioning}
      platforms={platforms}
      signals={signals ?? []}
      isAdmin={isAdminEmail(user.email)}
      conversations={conversations ?? []}
      activeConversationId={conv}
    >
      <ChatClient
        conversationId={conv}
        initialMessages={initialMessages}
      />
    </ChatShell>
  );
}
