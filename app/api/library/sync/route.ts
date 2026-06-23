import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";
import {
  DriveNotConfiguredError,
  buildRowFromDriveFile,
  downloadFileText,
  getDriveAccessToken,
  listFolderFiles,
  type SyncCounters,
} from "@/lib/library/drive";

export const maxDuration = 300;

// POST — "Actualizar biblioteca": sincroniza una carpeta de Drive.
// Procesa solo archivos nuevos o modificados (dedupe por provider_file_id +
// modifiedTime). Registra todo en content_sync_logs (visible al usuario).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  let body: { sourceId?: string };
  try {
    body = await request.json();
  } catch {
    return new NextResponse("JSON no válido", { status: 400 });
  }
  const sourceId = body.sourceId;
  if (!sourceId) return new NextResponse("Falta sourceId", { status: 400 });

  const { data: source, error: srcErr } = await supabase
    .from("content_sources")
    .select("id, provider_folder_id")
    .eq("id", sourceId)
    .maybeSingle();
  if (srcErr) return new NextResponse(srcErr.message, { status: 500 });
  if (!source) return new NextResponse("Origen no encontrado", { status: 404 });

  // Abre traza de sincronización.
  const { data: log } = await supabase
    .from("content_sync_logs")
    .insert({ user_id: user.id, source_id: sourceId, status: "running" })
    .select("id")
    .single();
  const logId = log?.id as string | undefined;

  await supabase
    .from("content_sources")
    .update({ sync_status: "syncing", sync_error: null })
    .eq("id", sourceId);

  const counters: SyncCounters = {
    filesFound: 0,
    filesImported: 0,
    filesUpdated: 0,
    filesFailed: 0,
    errors: [],
  };

  try {
    const token = await getDriveAccessToken(sourceId);
    const files = await listFolderFiles(token, source.provider_folder_id as string);
    counters.filesFound = files.length;

    // Estado actual para dedupe.
    const { data: existing } = await supabase
      .from("content_library")
      .select("id, provider_file_id, provider_modified_at")
      .eq("source_id", sourceId);
    const byFileId = new Map(
      (existing ?? []).map((r) => [
        r.provider_file_id as string,
        {
          id: r.id as string,
          modifiedAt: r.provider_modified_at as string | null,
        },
      ])
    );

    for (const file of files) {
      const prev = byFileId.get(file.id);
      // Sin cambios desde la última importación → saltar.
      if (prev && prev.modifiedAt === file.modifiedTime) continue;

      try {
        const text = await downloadFileText(token, file);
        const built = buildRowFromDriveFile(user.id, sourceId, file, text);
        if (!built.ok) {
          counters.filesFailed++;
          counters.errors.push(`${file.name}: ${built.error}`);
          continue;
        }
        if (prev) {
          await supabase
            .from("content_library")
            .update(built.row)
            .eq("id", prev.id);
          counters.filesUpdated++;
        } else {
          await supabase.from("content_library").insert(built.row);
          counters.filesImported++;
        }
      } catch (err) {
        counters.filesFailed++;
        counters.errors.push(
          `${file.name}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    const finalStatus = counters.filesFailed > 0 ? "partial" : "completed";
    await finishLog(supabase, logId, finalStatus, counters);
    await supabase
      .from("content_sources")
      .update({
        sync_status: "connected",
        sync_error: counters.errors[0] ?? null,
        last_sync_at: new Date().toISOString(),
      })
      .eq("id", sourceId);

    return NextResponse.json({ ok: true, counters });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const notConfigured = err instanceof DriveNotConfiguredError;
    await finishLog(supabase, logId, "failed", counters, message);
    await supabase
      .from("content_sources")
      .update({ sync_status: "error", sync_error: message })
      .eq("id", sourceId);

    return NextResponse.json(
      { ok: false, error: message, notConfigured },
      { status: notConfigured ? 501 : 500 }
    );
  }
}

async function finishLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  logId: string | undefined,
  status: "completed" | "failed" | "partial",
  counters: SyncCounters,
  extraError?: string
): Promise<void> {
  if (!logId) return;
  const errorLog = [extraError, ...counters.errors].filter(Boolean).join("\n");
  await supabase
    .from("content_sync_logs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      files_found: counters.filesFound,
      files_imported: counters.filesImported,
      files_updated: counters.filesUpdated,
      files_failed: counters.filesFailed,
      error_log: errorLog || null,
    })
    .eq("id", logId);
}
