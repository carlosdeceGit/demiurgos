import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";
import { cleanMarkdown, contentHash } from "@/lib/library/convert";

type Ctx = { params: Promise<{ id: string }> };

// GET — detalle completo (incluye el markdown_content, que la lista omite).
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  const { data, error } = await supabase
    .from("content_library")
    .select(
      "id, title, tags, markdown_content, status, conversion_tool, conversion_error, original_file_name, original_extension, source_type, source_url, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return new NextResponse(error.message, { status: 500 });
  if (!data) return new NextResponse("No encontrado", { status: 404 });

  return NextResponse.json({ item: data });
}

// PATCH — editar título, etiquetas o el propio Markdown (revisión manual).
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  let body: { title?: string; tags?: string[]; markdown_content?: string };
  try {
    body = await request.json();
  } catch {
    return new NextResponse("JSON no válido", { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title.trim().slice(0, 200);
  if (Array.isArray(body.tags)) {
    patch.tags = body.tags
      .filter((t) => typeof t === "string")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 25);
  }
  if (typeof body.markdown_content === "string") {
    const md = cleanMarkdown(body.markdown_content);
    patch.markdown_content = md;
    patch.markdown_size = md.length;
    patch.content_hash = md ? contentHash(md) : null;
    // Editar a mano resuelve un "requiere revisión".
    patch.status = "completed";
    patch.conversion_error = null;
  }

  if (Object.keys(patch).length === 0) {
    return new NextResponse("Nada que actualizar", { status: 400 });
  }

  const { data, error } = await supabase
    .from("content_library")
    .update(patch)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return new NextResponse(error.message, { status: 500 });
  if (!data) return new NextResponse("No encontrado", { status: 404 });

  return NextResponse.json({ ok: true });
}

// DELETE — eliminar la pieza (RLS garantiza que sea del usuario).
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  const { error } = await supabase
    .from("content_library")
    .delete()
    .eq("id", id);

  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
