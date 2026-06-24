import { contentHash, convertText } from "./convert";
import { decryptSecret, tokenCryptoConfigured } from "./crypto";
import { extensionOf } from "./types";

// Scope mínimo: solo lectura de Drive + email de la cuenta (para mostrarlo).
export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

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

// URL de consentimiento de Google (cada usuario autoriza su propia cuenta).
// access_type=offline + prompt=consent → garantiza refresh token.
export function buildConsentUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: DRIVE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

// Canjea el authorization code por tokens (incluye refresh token la 1ª vez).
export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });
  const json = (await res.json()) as TokenResponse;
  if (!res.ok || json.error) {
    throw new Error(
      `OAuth token exchange falló: ${json.error_description ?? json.error ?? res.status}`
    );
  }
  return json;
}

// Email de la cuenta conectada (para mostrarlo; no se guarda nada sensible).
export async function fetchAccountEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { email?: string };
    return json.email ?? null;
  } catch {
    return null;
  }
}

// Canjea el refresh token cifrado del origen por un access token fresco.
export async function getDriveAccessToken(
  tokenRef: string | null | undefined
): Promise<string> {
  if (!driveOAuthConfigured()) {
    throw new DriveNotConfiguredError(
      "Google Drive aún no está configurado. Añade GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI y LIBRARY_TOKEN_SECRET, y reconecta tu cuenta (ver docs/CONTENT_LIBRARY.md)."
    );
  }
  if (!tokenCryptoConfigured()) {
    throw new DriveNotConfiguredError(
      "Falta LIBRARY_TOKEN_SECRET para descifrar la credencial de Drive."
    );
  }
  if (!tokenRef) {
    throw new DriveNotConfiguredError(
      "Esta cuenta de Drive no está conectada. Pulsa «Conectar Google Drive» para autorizar el acceso."
    );
  }

  const refreshToken = decryptSecret(tokenRef);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json()) as TokenResponse;
  if (!res.ok || !json.access_token) {
    throw new Error(
      `No se pudo refrescar el acceso a Drive: ${json.error_description ?? json.error ?? res.status}. Vuelve a conectar la cuenta.`
    );
  }
  return json.access_token;
}

// Lista las carpetas del usuario (para elegir cuál sincronizar).
export async function listUserFolders(
  accessToken: string
): Promise<{ id: string; name: string }[]> {
  const params = new URLSearchParams({
    q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    fields: "files(id, name)",
    pageSize: "100",
    orderBy: "name",
  });
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { files?: { id: string; name: string }[] };
  return json.files ?? [];
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
