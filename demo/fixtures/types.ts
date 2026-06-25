// Tipos de los datos de demostración (fixtures). Alineados, a grandes rasgos, con
// el esquema real de la base de datos para poder reutilizarlos al sembrar.
// Son datos FALSOS e ilustrativos: viven solo en /demo, no tocan la base real.

export type DemoPlatformKey =
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "instagram"
  | "x"
  | "substack";

export type DemoPillar = { title: string; why: string };

export type DemoProfile = {
  id: string; // slug estable, p. ej. "carlos"
  displayName: string;
  sector: string; // etiqueta corta del sector, para el selector de demo
  positioning: string; // una frase de posicionamiento
  audience: string; // a quién le habla
  voice: string[]; // reglas duras / rasgos de voz
  pillars: DemoPillar[];
  activePlatforms: DemoPlatformKey[];
  onboardingCompleted: boolean;
  completeness: number; // 0..100, para la barra del dashboard
  createdAt: string; // ISO
};

export type DemoProposalStatus = "nueva" | "aceptada" | "descartada";

export type DemoProposal = {
  id: string;
  profileId: string;
  platform: DemoPlatformKey;
  day: string; // "Martes"
  idea: string;
  whyNow: string;
  script: string;
  slot: string;
  status: DemoProposalStatus;
  model: string;
};

export type DemoSignalSource = "chat" | "upload" | "research";

export type DemoSignal = {
  id: string;
  profileId: string;
  content: string;
  source: DemoSignalSource;
  date: string; // ISO
};

export type DemoMessage = { role: "user" | "assistant"; content: string };

export type DemoConversation = {
  profileId: string;
  messages: DemoMessage[];
};

// Una corrida del consejo de IAs (para el panel admin: coste/modelo/uso).
export type DemoAiRun = {
  id: string;
  profileId: string;
  role: "director" | "critico" | "analista" | "investigador";
  model: string;
  tokens: number;
  cost: number; // USD
  date: string; // ISO (día)
};

// Idea exploratoria del banco de ideas.
export type DemoIdea = {
  id: string;
  profileId: string;
  generation_id: string;
  idea: string;
  why_interesting: string;
  platform: DemoPlatformKey;
  content_type: string;
  status: "nueva" | "guardada" | "descartada";
  created_at: string;
};

// Elemento de la biblioteca de contenidos.
export type DemoLibraryItem = {
  id: string;
  profileId: string;
  title: string;
  tags: string[];
  originalFileName: string;
  originalExtension: string;
  originalSize: number;
  sourceType: "manual_upload" | "google_drive";
  status: "completed" | "synced";
  markdownSize: number;
  createdAt: string;
  updatedAt: string;
};

// Propuesta enriquecida para la vista /propuestas (compatible con ProposalRow real).
export type DemoFullProposal = {
  id: string;
  profileId: string;
  platform: string;
  idea: string;
  why_now: string;
  script: string;
  image_prompt: string | null;
  suggested_slot: string;
  status: string;
  expires_at: string | null;
  content_type: string;
  content_category: string;
  based_on: { hook: string; caption?: string; format?: string } | null;
  created_at: string;
};

// Entrada de calendario (compatible con CalendarProposal real).
export type DemoCalendarEntry = {
  id: string;
  profileId: string;
  idea: string;
  why_now: string;
  platform: string;
  status: string;
  suggested_slot: string;
  week_of: string;
  based_on: { hook: string; format?: string } | null;
  content_type: string;
  content_category: string;
  expires_at: string | null;
};
