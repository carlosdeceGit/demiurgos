import { createClient } from "@supabase/supabase-js";

// Cliente con service_role: IGNORA RLS. Úsalo SOLO en el servidor y en
// scripts de confianza (p. ej. el seed). Nunca lo expongas al cliente.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
