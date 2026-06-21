import { config } from "dotenv";
config({ path: ".env.local" });

import { promises as fs } from "node:fs";
import path from "node:path";

import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import { parseConocimiento } from "./parse-conocimiento";
import { mapPerfil } from "./map-perfil";

const ROOT = process.cwd();
const SPEC_DIR = path.join(ROOT, "v1-proyecto-claude");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

async function findUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<User | null> {
  // Pagina por los usuarios de auth y busca por email (no hay get-by-email).
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const found = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (found) return found;
    if (data.users.length < 1000) break;
  }
  return null;
}

async function ensureSeedUser(
  admin: SupabaseClient,
  email: string
): Promise<string> {
  const existing = await findUserByEmail(admin, email);
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const seedEmail = requireEnv("SEED_USER_EMAIL");

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Motor (capa 1): copiar INSTRUCCIONES.md → seed/motor.md (prompt base).
  const motor = await fs.readFile(
    path.join(SPEC_DIR, "INSTRUCCIONES.md"),
    "utf8"
  );
  await fs.writeFile(path.join(ROOT, "seed", "motor.md"), motor, "utf8");
  console.log("✓ Motor copiado a seed/motor.md");

  // 2. Conocimiento del ecosistema (capa 4): una fila por red.
  const conocimientoMd = await fs.readFile(
    path.join(SPEC_DIR, "CONOCIMIENTO_REDES.md"),
    "utf8"
  );
  const knowledge = parseConocimiento(conocimientoMd);
  if (knowledge.length !== 6) {
    throw new Error(
      `Se esperaban 6 redes en ecosystem_knowledge, se parsearon ${knowledge.length}`
    );
  }

  const platforms = knowledge.map((k) => k.platform);
  await admin.from("ecosystem_knowledge").delete().in("platform", platforms);
  const { error: knowErr } = await admin.from("ecosystem_knowledge").insert(
    knowledge.map((k) => ({
      platform: k.platform,
      content: k.content,
      version: 1,
      is_current: true,
    }))
  );
  if (knowErr) throw knowErr;
  console.log(`✓ ecosystem_knowledge sembrado (${knowledge.length} redes)`);

  // 3. Instancia de perfil (capa 3): PERFIL_CARLOS.md → fila de profiles.
  const userId = await ensureSeedUser(admin, seedEmail);
  console.log(`✓ Usuario semilla: ${seedEmail} (${userId})`);

  const perfilMd = await fs.readFile(
    path.join(SPEC_DIR, "PERFIL_CARLOS.md"),
    "utf8"
  );
  const profile = mapPerfil(perfilMd);

  const { error: profErr } = await admin
    .from("profiles")
    .upsert({ user_id: userId, ...profile }, { onConflict: "user_id" });
  if (profErr) throw profErr;
  console.log(
    `✓ profiles sembrado: ${profile.display_name} (${profile.platforms.length} plataformas)`
  );

  console.log("\nSeed completado.");
}

main().catch((err) => {
  console.error("Seed falló:", err);
  process.exit(1);
});
