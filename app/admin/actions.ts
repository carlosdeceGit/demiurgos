"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/db/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { updateModelSettings } from "@/lib/db/settings";

// Guarda los modelos elegidos para cada rol del consejo. Solo admins.
export async function saveModelSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) {
    throw new Error("No autorizado");
  }

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
