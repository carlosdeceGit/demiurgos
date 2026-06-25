import { createClient } from "@/lib/db/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("No autenticado", { status: 401 });

  // Verificar que la conversación pertenece al usuario (RLS lo garantiza)
  const { data: messages } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return Response.json({ messages: messages ?? [] });
}
