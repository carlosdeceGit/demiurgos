import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";
import { driveOAuthConfigured } from "@/lib/library/drive";
import { mapContentSource } from "@/lib/library/queries";

const SOURCE_COLUMNS =
  "id, provider, provider_folder_id, provider_folder_name, provider_account_email, sync_status, sync_error, last_sync_at";

// POST — conectar/registrar una carpeta de Google Drive.
// Sin OAuth configurado, igualmente se guarda la referencia de la carpeta
// (queda 'disconnected') para dejar la integración lista; con OAuth, 'connected'.
export async function POST(request: Request) {
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
  const folderName = body.folderName?.trim() || "Carpeta de Drive";
  if (!folderId) {
    return new NextResponse("Falta el id de la carpeta de Drive.", {
      status: 400,
    });
  }

  const { data, error } = await supabase
    .from("content_sources")
    .insert({
      user_id: user.id,
      source_type: "google_drive",
      provider: "google_drive",
      provider_folder_id: folderId,
      provider_folder_name: folderName,
      sync_status: driveOAuthConfigured() ? "connected" : "disconnected",
      sync_error: driveOAuthConfigured()
        ? null
        : "Pendiente de autorizar el acceso OAuth (ver configuración).",
    })
    .select(SOURCE_COLUMNS)
    .single();

  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json({ source: mapContentSource(data) });
}

// DELETE — desconectar un origen (?id=...). El contenido ya importado se conserva.
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return new NextResponse("Falta el id del origen.", { status: 400 });

  const { error } = await supabase.from("content_sources").delete().eq("id", id);
  if (error) return new NextResponse(error.message, { status: 500 });
  return NextResponse.json({ ok: true });
}
