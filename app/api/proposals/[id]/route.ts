import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";

// PATCH /api/proposals/[id]
// Body: { status: string, feedback_reason?: string }
// Acciones válidas: liked | disliked | ejecutada | guardada | descartada
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  let body: { status?: string; feedback_reason?: string };
  try {
    body = (await request.json()) as { status?: string; feedback_reason?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const VALID = ["liked", "disliked", "ejecutada", "guardada", "descartada", "nueva"];
  if (!body.status || !VALID.includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const update: Record<string, unknown> = { status: body.status };
  if (body.feedback_reason) update.feedback_reason = body.feedback_reason;

  // RLS garantiza que solo se puede editar la propuesta propia.
  const { error } = await supabase
    .from("proposals")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[proposals patch]", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
