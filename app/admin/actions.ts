"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/db/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { updateModelSettings, updateTrendSettings } from "@/lib/db/settings";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) {
    throw new Error("No autorizado");
  }
}

// Guarda los modelos elegidos para cada rol del consejo. Solo admins.
export async function saveModelSettings(formData: FormData) {
  await requireAdmin();

  const str = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };

  await updateModelSettings({
    directorModel: str("directorModel"),
    criticModel: str("criticModel"),
    analystModel: str("analystModel"),
    demoModel: str("demoModel"),
    orchestratorModel: str("orchestratorModel"),
    trendModel: str("trendModel"),
    ideaModel: str("ideaModel"),
    scriptModel: str("scriptModel"),
    imageDirectorModel: str("imageDirectorModel"),
  });

  revalidatePath("/admin");
}

// Guarda la config de fuentes de tendencias en tiempo real. Solo admins.
// El secreto (key del proveedor) no se toca aquí: vive en env (TRENDS_API_KEY).
export async function saveTrendSettings(formData: FormData) {
  await requireAdmin();

  const provider = formData.get("trendsProvider");
  const sources = formData.get("trendsSources");

  await updateTrendSettings({
    enabled: formData.get("trendsEnabled") === "on",
    provider:
      typeof provider === "string" && provider.trim()
        ? provider.trim()
        : undefined,
    sources: typeof sources === "string" ? sources.trim() : undefined,
  });

  revalidatePath("/admin");
}
