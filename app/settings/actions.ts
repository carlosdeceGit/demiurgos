"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/db/server";
import { saveUserModelPreferences } from "@/lib/db/user-settings";
import { TASK_GROUP_IDS } from "@/lib/ai/model-catalog";
import type { UserModelPreferences } from "@/lib/ai/resolve-models";

// Guarda las preferencias de IA del usuario (un slug por grupo de tarea).
// Cada usuario solo edita lo suyo (RLS sobre profiles).
export async function saveModelPreferences(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const prefs: UserModelPreferences = {};
  for (const id of TASK_GROUP_IDS) {
    const v = formData.get(id);
    if (typeof v === "string" && v.trim()) prefs[id] = v.trim();
  }

  await saveUserModelPreferences(supabase, user.id, prefs);
  revalidatePath("/settings");
}
