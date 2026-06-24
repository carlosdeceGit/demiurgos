import { createClient } from "@/lib/db/server";
import { redirect } from "next/navigation";

const VALID_STATUSES = ["nueva", "guardada", "descartada"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { status } = (await req.json()) as { status: string };

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return new Response("Estado inválido", { status: 400 });
  }

  const { error } = await supabase
    .from("ideas")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return new Response(error.message, { status: 500 });
  return new Response(null, { status: 204 });
}
