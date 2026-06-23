// Biblioteca de contenidos — tipos y constantes compartidas (cliente y servidor).

export type ContentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "needs_review"
  | "synced";

export type ContentSourceType = "manual_upload" | "google_drive" | "other";

export type SyncStatus = "disconnected" | "connected" | "syncing" | "error";

// Fila tal y como la consume la UI (camelCase, sin el markdown completo en la
// lista para no inflar la carga; el detalle lo trae aparte).
export type ContentItem = {
  id: string;
  title: string;
  tags: string[];
  originalFileName: string | null;
  originalMimeType: string | null;
  originalExtension: string | null;
  originalSize: number | null;
  sourceType: ContentSourceType;
  sourceUrl: string | null;
  status: ContentStatus;
  conversionTool: string | null;
  conversionError: string | null;
  markdownSize: number;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;
};

export type ContentSource = {
  id: string;
  provider: string;
  providerFolderId: string | null;
  providerFolderName: string | null;
  providerAccountEmail: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncAt: string | null;
};

export type SyncLog = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "completed" | "failed" | "partial";
  filesFound: number;
  filesImported: number;
  filesUpdated: number;
  filesFailed: number;
  errorLog: string | null;
};

// Formatos que se aceptan sin conversión externa (subida directa óptima).
export const NATIVE_EXTENSIONS = ["md", "markdown", "txt"] as const;
// Imágenes: se intenta OCR si hay infraestructura (modelo de visión).
export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
// Formatos que se intentan convertir a Markdown con una herramienta ligera.
export const CONVERTIBLE_EXTENSIONS = ["html", "htm"] as const;
// Formatos reconocidos pero que requieren un servicio externo (punto de
// integración documentado): se registran con estado claro, sin romper nada.
export const EXTERNAL_CONVERSION_EXTENSIONS = [
  "pdf",
  "docx",
  "rtf",
  "odt",
] as const;

// Límite de tamaño por archivo (10 MB). El objetivo es alimentar modelos de IA
// con Markdown ligero, no almacenar binarios grandes.
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const STATUS_LABELS: Record<ContentStatus, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  completed: "Convertido",
  failed: "Error",
  needs_review: "Requiere revisión",
  synced: "Sincronizado",
};

export const SOURCE_LABELS: Record<ContentSourceType, string> = {
  manual_upload: "Subida manual",
  google_drive: "Google Drive",
  other: "Otro",
};

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0 || dot === fileName.length - 1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

export function isImageExtension(ext: string): boolean {
  return (IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}
