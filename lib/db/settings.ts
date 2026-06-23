import { createAdminClient } from "@/lib/db/admin";
import { MODELS } from "@/lib/ai/gateway";

export type ModelSettings = {
  // Chat + demo (ya existían).
  directorModel: string;
  criticModel: string;
  analystModel: string;
  demoModel: string;
  // Orquestador multi-agente (calendario semanal).
  orchestratorModel: string;
  trendModel: string;
  ideaModel: string;
  scriptModel: string;
  imageDirectorModel: string;
};

function fallbackSettings(): ModelSettings {
  return {
    directorModel: MODELS.director,
    criticModel: MODELS.critic,
    analystModel: MODELS.analyst,
    demoModel: MODELS.demo,
    orchestratorModel: MODELS.orchestrator,
    trendModel: MODELS.trend,
    ideaModel: MODELS.idea,
    scriptModel: MODELS.script,
    imageDirectorModel: MODELS.imageDirector,
  };
}

// Lee los ajustes de modelos (tabla settings, service role). Si la fila no
// existe o falla (p. ej. columnas nuevas todavía sin migrar), cae a los
// valores de entorno/defaults — el pipeline sigue funcionando.
export async function getModelSettings(): Promise<ModelSettings> {
  const fallback = fallbackSettings();

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("settings")
      .select(
        "director_model, critic_model, analyst_model, demo_model, orchestrator_model, trend_model, idea_model, script_model, image_director_model"
      )
      .eq("id", true)
      .maybeSingle();
    if (!data) return fallback;
    return {
      directorModel: data.director_model ?? fallback.directorModel,
      criticModel: data.critic_model ?? fallback.criticModel,
      analystModel: data.analyst_model ?? fallback.analystModel,
      demoModel: data.demo_model ?? fallback.demoModel,
      orchestratorModel:
        data.orchestrator_model ?? fallback.orchestratorModel,
      trendModel: data.trend_model ?? fallback.trendModel,
      ideaModel: data.idea_model ?? fallback.ideaModel,
      scriptModel: data.script_model ?? fallback.scriptModel,
      imageDirectorModel:
        data.image_director_model ?? fallback.imageDirectorModel,
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
  if (patch.orchestratorModel)
    row.orchestrator_model = patch.orchestratorModel;
  if (patch.trendModel) row.trend_model = patch.trendModel;
  if (patch.ideaModel) row.idea_model = patch.ideaModel;
  if (patch.scriptModel) row.script_model = patch.scriptModel;
  if (patch.imageDirectorModel)
    row.image_director_model = patch.imageDirectorModel;
  if (Object.keys(row).length === 0) return;

  const { error } = await admin.from("settings").update(row).eq("id", true);
  if (error) throw error;
}
