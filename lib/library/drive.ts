import { contentHash, convertText } from "./convert";
import { extensionOf } from "./types";

// ─────────────────────────────────────────────────────────────
// Google Drive — sincronización de una carpeta a la biblioteca.
//
// Estado: la LÓGICA de sincronización está completa (listar carpeta, detectar
// nuevos/modificados por id + modifiedTime, convertir a Markdown, evitar
// duplicados). El ÚNICO punto que requiere configuración es la obtención del
// access token OAuth del usuario (`getDriveAccessToken`), porque exige registrar
// una app en Google Cloud y completar el consent flow. Ver docs/CONTENT_LIBRARY.md.
//
// Cuando OAuth no está configurado, `getDriveAccessToken` lanza
// DriveNotConfiguredError y la ruta de sync responde con un mensaje claro y
// registra el intento en content_sync_logs (sin romper la app).
// ─────────────────────────────────────────────────────────────

export class DriveNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DriveNotConfiguredError";
  }
}

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  size?: string;
};

export function driveOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  );
}

// PUNTO DE INTEGRACIÓN OAuth.
// Debe devolver un access token válido para el usuario/origen dados. La pieza
// que falta es persistir de forma segura (cifrada / Supabase Vault) el refresh
// token tras el consent, y canjearlo aquí. Mientras no exista, lanzamos un error
// explícito para que la UI lo comunique con claridad.
export async function getDriveAccessToken(_sourceId: string): Promise<string> {
  void _sourceId;
  if (!driveOAuthConfigured()) {
    throw new DriveNotConfiguredError(
      "Google Drive aún no está configurado. Añade GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI, y completa el flujo OAuth (ver docs/CONTENT_LIBRARY.md)."
    );
  }
  // Con OAuth configurado, aquí se canjearía el refresh token cifrado del origen
  // por un access token. Punto de integración pendiente de credenciales reales.
  throw new DriveNotConfiguredError(
    "Falta el intercambio de refresh token de Google Drive (consent flow). Ver docs/CONTENT_LIBRARY.md."
  );
}

// Lista los archivos de una carpeta de Drive (no recursivo, sin papelera).
export async function listFolderFiles(
  accessToken: string,
  folderId: string
): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink, size)",
      pageSize: "100",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      throw new Error(`Drive API ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as {
      files?: DriveFile[];
      nextPageToken?: string;
    };
    files.push(...(json.files ?? []));
    pageToken = json.nextPageToken;
  } while (pageToken);
  return files;
}

// Descarga el contenido textual de un archivo de Drive. Los Google Docs se
// exportan a texto plano; el resto se descargan tal cual.
export async function downloadFileText(
  accessToken: string,
  file: DriveFile
): Promise<string> {
  const isGoogleDoc = file.mimeType.startsWith("application/vnd.google-apps");
  const url = isGoogleDoc
    ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`
    : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Drive download ${res.status}: ${await res.text()}`);
  }
  return res.text();
}

// Decide la extensión efectiva para la conversión a partir del nombre/mimeType.
export function driveFileExtension(file: DriveFile): string {
  if (file.mimeType === "application/vnd.google-apps.document") return "txt";
  const ext = extensionOf(file.name);
  return ext || "txt";
}

export type SyncCounters = {
  filesFound: number;
  filesImported: number;
  filesUpdated: number;
  filesFailed: number;
  errors: string[];
};

// Prepara la fila a insertar/actualizar para un archivo de Drive ya descargado.
// Devuelve null si el formato no es convertible como texto (se cuenta como fallo
// con mensaje claro, sin romper la sincronización).
export function buildRowFromDriveFile(
  userId: string,
  sourceId: string,
  file: DriveFile,
  text: string
) {
  const ext = driveFileExtension(file);
  const outcome = convertText({ text, ext, fileName: file.name });
  if (!outcome.markdown && outcome.status === "failed") {
    return { ok: false as const, error: outcome.error ?? "No convertible" };
  }
  const markdown = outcome.markdown ?? "";
  return {
    ok: true as const,
    row: {
      user_id: userId,
      source_id: sourceId,
      source_type: "google_drive" as const,
      provider_file_id: file.id,
      provider_modified_at: file.modifiedTime,
      source_url: file.webViewLink ?? null,
      original_file_name: file.name,
      original_mime_type: file.mimeType,
      original_extension: ext,
      original_size: file.size ? Number(file.size) : null,
      title: outcome.title,
      markdown_content: markdown,
      markdown_size: markdown.length,
      content_hash: contentHash(markdown),
      status: outcome.status === "completed" ? "synced" : outcome.status,
      conversion_tool: outcome.tool,
      conversion_error: outcome.error,
      last_synced_at: new Date().toISOString(),
    },
  };
}
