import { redirect } from "next/navigation";

import { createClient } from "@/lib/db/server";
import { ChatClient } from "@/components/chat/chat-client";

// Pantalla de chat a pantalla completa. La ruta está protegida por middleware;
// aquí volvemos a comprobar la sesión por seguridad.
export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <ChatClient email={user.email ?? ""} />;
}
