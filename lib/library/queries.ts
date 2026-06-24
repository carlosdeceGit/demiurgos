import type {
  ContentItem,
  ContentSource,
  ContentStatus,
  ContentSourceType,
  SyncLog,
  SyncStatus,
} from "./types";

// Mapeadores fila BD (snake_case) → tipo de UI (camelCase). Centralizados para
// que la página, las rutas y los tests compartan el mismo contrato.

type Row = Record<string, unknown>;

export const CONTENT_LIST_COLUMNS =
  "id, title, tags, original_file_name, original_mime_type, original_extension, original_size, source_type, source_url, status, conversion_tool, conversion_error, markdown_size, created_at, updated_at, last_synced_at";

export function mapContentItem(row: Row): ContentItem {
  return {
    id: row.id as string,
    title: (row.title as string) ?? "Sin título",
    tags: (row.tags as string[]) ?? [],
    originalFileName: (row.original_file_name as string) ?? null,
    originalMimeType: (row.original_mime_type as string) ?? null,
    originalExtension: (row.original_extension as string) ?? null,
    originalSize: (row.original_size as number) ?? null,
    sourceType: (row.source_type as ContentSourceType) ?? "manual_upload",
    sourceUrl: (row.source_url as string) ?? null,
    status: (row.status as ContentStatus) ?? "pending",
    conversionTool: (row.conversion_tool as string) ?? null,
    conversionError: (row.conversion_error as string) ?? null,
    markdownSize: (row.markdown_size as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    lastSyncedAt: (row.last_synced_at as string) ?? null,
  };
}

export function mapContentSource(row: Row): ContentSource {
  return {
    id: row.id as string,
    provider: (row.provider as string) ?? "google_drive",
    providerFolderId: (row.provider_folder_id as string) ?? null,
    providerFolderName: (row.provider_folder_name as string) ?? null,
    providerAccountEmail: (row.provider_account_email as string) ?? null,
    syncStatus: (row.sync_status as SyncStatus) ?? "disconnected",
    syncError: (row.sync_error as string) ?? null,
    lastSyncAt: (row.last_sync_at as string) ?? null,
  };
}

export function mapSyncLog(row: Row): SyncLog {
  return {
    id: row.id as string,
    startedAt: row.started_at as string,
    finishedAt: (row.finished_at as string) ?? null,
    status: (row.status as SyncLog["status"]) ?? "running",
    filesFound: (row.files_found as number) ?? 0,
    filesImported: (row.files_imported as number) ?? 0,
    filesUpdated: (row.files_updated as number) ?? 0,
    filesFailed: (row.files_failed as number) ?? 0,
    errorLog: (row.error_log as string) ?? null,
  };
}
