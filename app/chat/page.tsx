import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { ChatClient } from "@/components/chat/chat-client";
import { ChatShell } from "@/components/chat/chat-shell";
import { activePlatformKeys, type ProfilePlatform } from "@/lib/ai/platforms";

// Pantalla de chat. La ruta está protegida por middleware; aquí volvemos a
// comprobar la sesión y cargamos el contexto que se muestra en el panel derecho.
export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, positioning, platforms")
    .eq("user_id", user.id)
    .maybeSingle();

  const platforms = activePlatformKeys(
    (profile?.platforms as ProfilePlatform[] | null) ?? null
  );

  const positioning =
    (profile?.positioning as { declaracion?: string } | null)?.declaracion ??
    null;

  const { data: signals } = await supabase
    .from("signals")
    .select("content, source")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <ChatShell
      email={user.email ?? ""}
      displayName={profile?.display_name ?? user.email ?? "Tú"}
      positioning={positioning}
      platforms={platforms}
      signals={signals ?? []}
    >
      <ChatClient />
    </ChatShell>
  );
}
