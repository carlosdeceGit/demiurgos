import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

// ─────────────────────────────────────────────────────────────
// Cifrado de credenciales (refresh tokens de Google Drive).
//
// Cada usuario conecta su PROPIA cuenta de Drive: guardamos su refresh token
// cifrado con AES-256-GCM (clave derivada de LIBRARY_TOKEN_SECRET). Nunca en
// claro. Si se prefiere, puede sustituirse por Supabase Vault sin tocar el resto
// del flujo (mismo contrato: encryptSecret / decryptSecret).
// ─────────────────────────────────────────────────────────────

const ALGO = "aes-256-gcm";

function key(): Buffer {
  const secret = process.env.LIBRARY_TOKEN_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "Falta LIBRARY_TOKEN_SECRET (>=16 chars) para cifrar credenciales de Drive."
    );
  }
  // Deriva 32 bytes estables a partir del secreto.
  return createHash("sha256").update(secret).digest();
}

export function tokenCryptoConfigured(): boolean {
  const s = process.env.LIBRARY_TOKEN_SECRET;
  return Boolean(s && s.length >= 16);
}

// Devuelve "iv.tag.ciphertext" en base64url.
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString("base64url")).join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Credencial cifrada con formato inválido.");
  }
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
