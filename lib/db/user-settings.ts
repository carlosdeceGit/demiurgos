import type { SupabaseClient } from "@supabase/supabase-js";

import {
  sanitizePreferences,
  type UserModelPreferences,
} from "@/lib/ai/resolve-models";

// Preferencias de IA por usuario, guardadas en profiles.model_preferences (jsonb).
// Se leen/escriben con el cliente de sesión → RLS garantiza que cada usuario
// solo toca lo suyo.

export async function getUserModelPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<UserModelPreferences> {
  const { data } = await supabase
    .from("profiles")
    .select("model_preferences")
    .eq("user_id", userId)
    .maybeSingle();
  return sanitizePreferences(data?.model_preferences);
}

export async function saveUserModelPreferences(
  supabase: SupabaseClient,
  userId: string,
  prefs: UserModelPreferences
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ model_preferences: sanitizePreferences(prefs) })
    .eq("user_id", userId);
  if (error) throw error;
}
