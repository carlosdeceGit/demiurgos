import { createAdminClient } from "@/lib/db/admin";
import { MODELS } from "@/lib/ai/gateway";

export type ModelSettings = {
  directorModel: string;
  criticModel: string;
  analystModel: string;
  demoModel: string;
};

// Lee los ajustes de modelos (tabla settings, service role). Si la fila no
// existe o falla, cae a los valores de entorno.
export async function getModelSettings(): Promise<ModelSettings> {
  const fallback: ModelSettings = {
    directorModel: MODELS.director,
    criticModel: MODELS.critic,
    analystModel: MODELS.analyst,
    demoModel: MODELS.demo,
  };

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("settings")
      .select("director_model, critic_model, analyst_model, demo_model")
      .eq("id", true)
      .maybeSingle();
    if (!data) return fallback;
    return {
      directorModel: data.director_model ?? fallback.directorModel,
      criticModel: data.critic_model ?? fallback.criticModel,
      analystModel: data.analyst_model ?? fallback.analystModel,
      demoModel: data.demo_model ?? fallback.demoModel,
    };
  } catch {
    return fallback;
  }
}

export async function updateModelSettings(
  patch: Partial<ModelSettings>
): Promise<void> {
  const admin = createAdminClient();
  const row: Record<string, string> = {};
  if (patch.directorModel) row.director_model = patch.directorModel;
  if (patch.criticModel) row.critic_model = patch.criticModel;
  if (patch.analystModel) row.analyst_model = patch.analystModel;
  if (patch.demoModel) row.demo_model = patch.demoModel;
  if (Object.keys(row).length === 0) return;

  const { error } = await admin
    .from("settings")
    .update(row)
    .eq("id", true);
  if (error) throw error;
}
