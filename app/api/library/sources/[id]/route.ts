import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";

type Ctx = { params: Promise<{ id: string }> };

// PATCH — fija la carpeta de Drive a sincronizar para una cuenta ya conectada.
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  let body: { folderId?: string; folderName?: string };
  try {
    body = await request.json();
  } catch {
    return new NextResponse("JSON no válido", { status: 400 });
  }
  const folderId = body.folderId?.trim();
  if (!folderId) return new NextResponse("Falta folderId", { status: 400 });

  const { data, error } = await supabase
    .from("content_sources")
    .update({
      provider_folder_id: folderId,
      provider_folder_name: body.folderName?.trim() || "Carpeta de Drive",
      sync_status: "connected",
      sync_error: null,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return new NextResponse(error.message, { status: 500 });
  if (!data) return new NextResponse("No encontrado", { status: 404 });
  return NextResponse.json({ ok: true });
}
