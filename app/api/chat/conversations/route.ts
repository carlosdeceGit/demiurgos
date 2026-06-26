import { createClient } from "@/lib/db/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("No autenticado", { status: 401 });

  // Últimas 30 conversaciones con su primer mensaje como título provisional
  const { data: convs } = await supabase
    .from("conversations")
    .select("id, title, created_at, last_message_at")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false })
    .limit(30);

  return Response.json({ conversations: convs ?? [] });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("No autenticado", { status: 401 });

  const { data: conv } = await supabase
    .from("conversations")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  return Response.json({ id: conv?.id });
}
