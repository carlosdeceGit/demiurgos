import { promises as fs } from "node:fs";
import path from "node:path";

import type { SupabaseClient } from "@supabase/supabase-js";

import { activePlatformKeys, type ProfilePlatform } from "@/lib/ai/platforms";

// ─────────────────────────────────────────────────────────────
// Tipos de las fuentes que se cruzan (capas de la arquitectura).
// ─────────────────────────────────────────────────────────────
export type ProfileRow = {
  display_name: string;
  positioning: unknown;
  pillars: unknown;
  audience: unknown;
  voice: unknown;
  tacit: unknown;
  goals: unknown;
  platforms: ProfilePlatform[] | null;
  performance_patterns: unknown;
  referents: unknown;
  social_insights: Record<string, { synthesized_at: string; posts_analyzed: number; referents_analyzed: number; content_dna: string }> | null;
};

export type KnowledgeRow = { platform: string; content: string };
export type SignalRow = {
  content: string;
  type: string | null;
  source: string | null;
};
export type MessageRow = { role: string; content: string };
export type SocialPostRow = {
  platform: string;
  account_url: string | null;
  target: string;
  post_text: string;
  post_date: string | null;
  engagement: Record<string, number> | null;
};

// Historial de feedback del usuario sobre propuestas anteriores.
export type LearningRow = {
  idea: string | null;
  platform: string | null;
  status: string; // 'liked' | 'ejecutada' | 'disliked'
  feedback_reason: string | null;
  based_on: Record<string, unknown> | null;
};

export type ComposeInput = {
  motor: string; // capa 1: el motor (INSTRUCCIONES.md)
  profile: ProfileRow | null; // capa 3: instancia del usuario (incluye social_insights)
  knowledge: KnowledgeRow[]; // capa 4: conocimiento del ecosistema
  socialPosts: SocialPostRow[]; // posts crudos (solo para tests / compatibilidad legacy)
  signals: SignalRow[]; // señales frescas (últimas 20)
  messages: MessageRow[]; // memoria de conversación (últimas 20)
  learning: LearningRow[]; // aprendizaje acumulado de feedback
};

const SIGNALS_LIMIT = 20;
const MESSAGES_LIMIT = 20;
const OWN_POSTS_PER_PLATFORM = 10;
const REFERENT_POSTS_PER_ACCOUNT = 5;

function section(title: string, body: string): string {
  return `\n\n# ${title}\n${body}`;
}

function renderProfile(profile: ProfileRow): string {
  // El perfil se entrega como datos legibles para el modelo. El motor es
  // genérico; aquí va la instancia concreta del usuario (su fuente de verdad).
  const field = (label: string, value: unknown) =>
    `## ${label}\n${JSON.stringify(value, null, 2)}`;

  const parts = [
    `Nombre: ${profile.display_name}`,
    field("Posicionamiento", profile.positioning),
    field("Pilares", profile.pillars),
    field("Audiencia", profile.audience),
    field("Voz y tono", profile.voice),
    field("Datos tácitos", profile.tacit),
    field("Objetivos", profile.goals),
    field("Plataformas", profile.platforms),
    field("Patrones de rendimiento", profile.performance_patterns),
    field("Referentes", profile.referents),
  ];

  // ADN de contenido: síntesis de los posts scrapeados, por plataforma.
  // Esto es la fuente más rica sobre cómo escribe y qué publica de verdad.
  if (profile.social_insights && Object.keys(profile.social_insights).length > 0) {
    const dnaBlocks = Object.entries(profile.social_insights)
      .map(([platform, data]) => {
        const meta = `${data.posts_analyzed} posts propios + ${data.referents_analyzed} de referentes · analizado ${new Date(data.synthesized_at).toLocaleDateString("es-ES")}`;
        return `### ${platform.toUpperCase()} (${meta})\n${data.content_dna}`;
      })
      .join("\n\n");
    parts.push(`## ADN de contenido (síntesis real de sus publicaciones — máxima prioridad para entender su voz)\n${dnaBlocks}`);
  }

  return parts.join("\n\n");
}

// Renderiza el historial de feedback como instrucciones claras para el modelo.
function renderLearning(rows: LearningRow[]): string {
  const positive = rows.filter(
    (r) => r.status === "liked" || r.status === "ejecutada"
  );
  const negative = rows.filter((r) => r.status === "disliked");

  const parts: string[] = [];

  if (positive.length > 0) {
    parts.push(
      "## Propuestas que han funcionado (liked o ejecutadas) — refuerza estos patrones\n" +
        positive
          .map((r) => {
            const hook =
              typeof r.based_on?.hook === "string" ? r.based_on.hook : r.idea;
            const fmt =
              typeof r.based_on?.format === "string"
                ? ` · ${r.based_on.format}`
                : "";
            return `- [${r.status}] ${r.platform ?? ""}${fmt} · "${hook ?? ""}"`;
          })
          .join("\n")
    );
  }

  if (negative.length > 0) {
    parts.push(
      "## Propuestas rechazadas — NO repitas estos patrones\n" +
        negative
          .map((r) => {
            const hook =
              typeof r.based_on?.hook === "string" ? r.based_on.hook : r.idea;
            const reason = r.feedback_reason
              ? ` · motivo: ${r.feedback_reason}`
              : "";
            return `- [disliked${reason}] ${r.platform ?? ""} · "${hook ?? ""}"`;
          })
          .join("\n")
    );
  }

  return (
    parts.join("\n\n") +
    "\n\nREGLA: Amplifica los patrones de lo que ha funcionado. Excluye activamente" +
    " los temas, formatos y estilos de lo rechazado. No repitas propuestas ya ejecutadas."
  );
}

// Agrupa y renderiza los posts sociales scrapeados.
// Posts propios primero (aprende la voz), luego referentes (aprende patrones externos).
function renderSocialPosts(posts: SocialPostRow[]): string {
  if (posts.length === 0) return "";

  const own = posts.filter((p) => p.target === "own");
  const referents = posts.filter((p) => p.target === "referent");

  const parts: string[] = [];

  if (own.length > 0) {
    // Agrupa por plataforma
    const byPlatform = new Map<string, SocialPostRow[]>();
    for (const p of own) {
      const list = byPlatform.get(p.platform) ?? [];
      list.push(p);
      byPlatform.set(p.platform, list);
    }

    const lines: string[] = [
      "## Contenido propio (publicaciones reales del usuario — aprende su voz y formatos)",
    ];
    for (const [platform, items] of byPlatform) {
      lines.push(`\n### ${platform.toUpperCase()}`);
      for (const item of items.slice(0, OWN_POSTS_PER_PLATFORM)) {
        const eng = item.engagement
          ? Object.entries(item.engagement)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : "";
        const meta = [item.post_date, eng].filter(Boolean).join(" · ");
        lines.push(`---\n${meta ? `(${meta})\n` : ""}${item.post_text.trim()}`);
      }
    }
    parts.push(lines.join("\n"));
  }

  if (referents.length > 0) {
    // Agrupa por cuenta de referente
    const byAccount = new Map<string, SocialPostRow[]>();
    for (const p of referents) {
      const key = `${p.platform}:${p.account_url ?? ""}`;
      const list = byAccount.get(key) ?? [];
      list.push(p);
      byAccount.set(key, list);
    }

    const lines: string[] = [
      "## Referentes (posts de cuentas que el usuario admira — extrae patrones, no copies)",
    ];
    for (const [key, items] of byAccount) {
      const [platform, url] = key.split(":");
      lines.push(`\n### ${platform.toUpperCase()} — ${url}`);
      for (const item of items.slice(0, REFERENT_POSTS_PER_ACCOUNT)) {
        const eng = item.engagement
          ? Object.entries(item.engagement)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : "";
        const meta = [item.post_date, eng].filter(Boolean).join(" · ");
        lines.push(`---\n${meta ? `(${meta})\n` : ""}${item.post_text.trim()}`);
      }
    }
    parts.push(lines.join("\n"));
  }

  return parts.join("\n\n");
}

// ─────────────────────────────────────────────────────────────
// Ensamblado puro: motor + perfil + conocimiento + señales + aprendizaje + memoria.
// Sin acceso a red ni a disco → fácil de testear.
// ─────────────────────────────────────────────────────────────
export function composeSystemPrompt(input: ComposeInput): string {
  const parts: string[] = [input.motor.trim()];

  if (input.profile) {
    parts.push(
      section(
        "PERFIL DEL USUARIO (instancia, tu fuente de verdad sobre la persona)",
        renderProfile(input.profile)
      )
    );
  } else {
    parts.push(
      section(
        "PERFIL DEL USUARIO",
        "Todavía no hay perfil. Si el usuario quiere propuestas, propón hacer el onboarding (Modo 1)."
      )
    );
  }

  if (input.knowledge.length > 0) {
    const body = input.knowledge
      .map((k) => `## ${k.platform}\n${k.content.trim()}`)
      .join("\n\n");
    parts.push(
      section(
        "CONOCIMIENTO DEL ECOSISTEMA (plataformas activas del usuario)",
        body
      )
    );
  }

  if (input.signals.length > 0) {
    const body = input.signals
      .map((s) => {
        const meta = [s.source, s.type].filter(Boolean).join("/");
        return `- ${meta ? `(${meta}) ` : ""}${s.content}`;
      })
      .join("\n");
    parts.push(section("SEÑALES RECIENTES", body));
  }

  if (input.learning.length > 0) {
    parts.push(
      section(
        "APRENDIZAJE ACUMULADO (señales de comportamiento del usuario — úsalas siempre)",
        renderLearning(input.learning)
      )
    );
  }

  if (input.messages.length > 0) {
    const body = input.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
    parts.push(
      section(
        "MEMORIA DE LA CONVERSACIÓN (últimos mensajes, para mantener contexto)",
        body
      )
    );
  }

  return parts.join("");
}

// Lee el motor (capa 1) desde el repo. El seed lo deja en seed/motor.md.
export async function loadMotor(): Promise<string> {
  const motorPath = path.join(process.cwd(), "seed", "motor.md");
  return fs.readFile(motorPath, "utf8");
}

// ─────────────────────────────────────────────────────────────
// Recogida de datos desde Supabase (respeta RLS con el cliente de sesión).
// Cruza el perfil del usuario con su conocimiento de plataformas activas,
// sus últimas 20 señales y sus últimos 20 mensajes.
// ─────────────────────────────────────────────────────────────
export async function gatherContext(
  supabase: SupabaseClient,
  userId: string
): Promise<ComposeInput> {
  const motor = await loadMotor();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, positioning, pillars, audience, voice, tacit, goals, platforms, performance_patterns, referents, social_insights"
    )
    .eq("user_id", userId)
    .maybeSingle();

  const platformKeys = activePlatformKeys(
    (profile?.platforms as ProfilePlatform[] | null) ?? null
  );

  let knowledge: KnowledgeRow[] = [];
  if (platformKeys.length > 0) {
    const { data } = await supabase
      .from("ecosystem_knowledge")
      .select("platform, content")
      .eq("is_current", true)
      .in("platform", platformKeys);
    knowledge = data ?? [];
  }

  const { data: signalsDesc } = await supabase
    .from("signals")
    .select("content, type, source")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(SIGNALS_LIMIT);

  const { data: messagesDesc } = await supabase
    .from("messages")
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MESSAGES_LIMIT);

  // Historial de feedback: últimas 40 acciones (liked, ejecutada, disliked).
  const { data: learningDesc } = await supabase
    .from("proposals")
    .select("idea, platform, status, feedback_reason, based_on")
    .eq("user_id", userId)
    .in("status", ["liked", "ejecutada", "disliked"])
    .order("created_at", { ascending: false })
    .limit(40);

  return {
    motor,
    profile: (profile as ProfileRow | null) ?? null,
    knowledge,
    socialPosts: [], // los posts crudos viven en social_posts; el ADN sintetizado está en profile.social_insights
    // Se piden en desc (los más recientes) y se invierten a orden cronológico.
    signals: (signalsDesc ?? []).reverse(),
    messages: (messagesDesc ?? []).reverse(),
    learning: (learningDesc ?? []) as LearningRow[],
  };
}
