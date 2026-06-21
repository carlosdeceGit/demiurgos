// Claves canónicas de plataforma. El conocimiento del ecosistema
// (ecosystem_knowledge.platform) y las plataformas del perfil se normalizan a
// estas claves para poder cruzarlos.
export const PLATFORM_KEYS = [
  "linkedin",
  "youtube",
  "tiktok",
  "instagram",
  "x",
  "substack",
] as const;

export type PlatformKey = (typeof PLATFORM_KEYS)[number];

// Una entrada de plataforma dentro del perfil (profiles.platforms jsonb).
export type ProfilePlatform = {
  key: PlatformKey;
  label?: string;
  role?: string;
  format?: string;
  // 'activo' marca las plataformas en las que el usuario juega de verdad.
  status?: string;
};

const ACTIVE_STATUSES = new Set(["activo", "active"]);

// Devuelve las claves canónicas de las plataformas activas del perfil.
export function activePlatformKeys(
  platforms: ProfilePlatform[] | undefined | null
): PlatformKey[] {
  if (!Array.isArray(platforms)) return [];
  return platforms
    .filter((p) => p && ACTIVE_STATUSES.has((p.status ?? "").toLowerCase()))
    .map((p) => p.key)
    .filter((k): k is PlatformKey =>
      (PLATFORM_KEYS as readonly string[]).includes(k)
    );
}
