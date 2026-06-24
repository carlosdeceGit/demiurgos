"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/db/server";
import { saveUserModelPreferences } from "@/lib/db/user-settings";
import { COMPETITION_GROUPS, TASK_GROUP_IDS } from "@/lib/ai/model-catalog";
import {
  COMPETE_AUTO,
  COMPETE_OFF,
  type UserModelPreferences,
} from "@/lib/ai/resolve-models";

// Guarda las preferencias de IA del usuario: modelo principal por grupo y, en los
// grupos que compiten, el 2.º modelo (o competición desactivada). Cualquier slug
// del gateway vale. Cada usuario solo edita lo suyo (RLS sobre profiles).
export async function saveModelPreferences(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const prefs: UserModelPreferences = { models: {}, competitors: {} };

  for (const id of TASK_GROUP_IDS) {
    const v = formData.get(id);
    if (typeof v === "string" && v.trim()) prefs.models[id] = v.trim();
  }

  for (const id of COMPETITION_GROUPS) {
    const enabled = formData.get(`${id}__compete_enabled`) != null;
    if (!enabled) {
      prefs.competitors[id] = COMPETE_OFF;
      continue;
    }
    const c = formData.get(`${id}__compete`);
    prefs.competitors[id] =
      typeof c === "string" && c.trim() ? c.trim() : COMPETE_AUTO;
  }

  await saveUserModelPreferences(supabase, user.id, prefs);
  revalidatePath("/settings");
}
