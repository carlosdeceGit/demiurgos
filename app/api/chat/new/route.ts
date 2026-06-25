import { createClient } from "@/lib/db/server";

// Archiva la conversación activa del usuario para que el próximo mensaje
// abra una nueva conversación.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autenticado", { status: 401 });
  }

  await supabase
    .from("conversations")
    .update({ archived_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("archived_at", null);

  return new Response(null, { status: 204 });
}
