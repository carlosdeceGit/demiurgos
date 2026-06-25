import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { ChatShell } from "@/components/chat/chat-shell";
import { isAdminEmail } from "@/lib/auth/admin";

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
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <ChatShell
      email={user.email ?? ""}
      displayName={profile?.display_name ?? user.email ?? "Tú"}
      isAdmin={isAdminEmail(user.email)}
    />
  );
}
