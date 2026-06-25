import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Cliente de Supabase para el servidor (Server Components, Route Handlers,
// Server Actions). Lee la sesión del usuario desde las cookies, así que las
// consultas respetan RLS y devuelven solo lo del usuario autenticado.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component: ignorable si hay middleware
            // refrescando la sesión.
          }
        },
      },
    }
  );
}

// Cliente con service-role para webhooks y jobs que no tienen sesión de usuario.
// Solo usar en Route Handlers server-side donde NO hay cookies de sesión.
export async function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
