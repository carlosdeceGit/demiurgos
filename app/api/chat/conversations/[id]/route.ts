import { createClient } from "@/lib/db/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("No autenticado", { status: 401 });

  // RLS garantiza que solo el propietario puede borrar
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return new Response(error.message, { status: 500 });

  return new Response(null, { status: 204 });
}
