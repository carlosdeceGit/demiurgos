// POST /api/apify/synthesize
// Lee todos los posts scrapeados de un usuario+plataforma y genera un
// "ADN de contenido" compacto con Claude. El resultado se guarda en
// profiles.social_insights[platform] para que el Director lo use siempre.
//
// Body: { userId: string, platform: string }
// Llamado internamente desde el webhook de Apify (fire-and-forget).

import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createServiceClient } from "@/lib/db/server";
import { gatewayModel, MODELS } from "@/lib/ai/gateway";
import { PLATFORM_KEYS } from "@/lib/ai/platforms";
import { sanitizePreferences, effectiveModel } from "@/lib/ai/resolve-models";

const SYNTHESIS_PROMPT = `Eres un analista de contenido experto. Vas a analizar el historial real de publicaciones de un creador en una red social y generarás un informe compacto y accionable que sirva como "ADN de contenido".

El informe debe cubrir exactamente estos apartados (en español, texto plano, sin markdown):

VOZ Y ESTILO
Cómo escribe realmente esta persona: longitud típica de los textos, estructura habitual (lista / narración / pregunta / dato + opinión), nivel de formalidad, uso del humor, palabras o expresiones que repite, lo que nunca hace.

TEMAS RECURRENTES
Los 5-8 temas principales que aparecen en su contenido, con el peso aproximado de cada uno.

PATRONES DE HOOK
Los 3-5 tipos de apertura que más usa esta persona para arrancar un post (con ejemplos literales de sus textos).

FORMATOS QUE DOMINA
Qué tipo de piezas produce más (posts de texto, hilos, carruseles, vídeos cortos, ensayos largos, etc.) y cómo los estructura habitualmente.

QUÉ RESUENA CON SU AUDIENCIA
Basándote en el engagement visible (likes, comentarios, shares), qué tipo de contenido genera más respuesta y por qué.

QUÉ EVITAR
Patrones de bajo rendimiento, temas que rara vez toca, errores que comete ocasionalmente.

SÍNTESIS EN UNA FRASE
Una sola frase que capture la esencia del contenido de esta persona.

Sé específico y usa ejemplos reales de los posts. No generalices. No inventes nada que no esté en los textos.`;

type PostRow = {
  post_text: string;
  post_date: string | null;
  engagement: Record<string, number> | null;
  target: string;
  account_url: string | null;
};

function buildAnalysisPrompt(platform: string, ownPosts: PostRow[], referentPosts: PostRow[]): string {
  const lines: string[] = [`PLATAFORMA: ${platform.toUpperCase()}\n`];

  if (ownPosts.length > 0) {
    lines.push(`=== POSTS PROPIOS (${ownPosts.length} publicaciones) ===\n`);
    for (const p of ownPosts) {
      const eng = p.engagement
        ? Object.entries(p.engagement)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${k}:${v}`)
            .join(" ")
        : "";
      const meta = [p.post_date, eng].filter(Boolean).join(" | ");
      lines.push(`[${meta}]\n${p.post_text.trim()}\n`);
    }
  }

  if (referentPosts.length > 0) {
    // Agrupar por cuenta
    const byAccount = new Map<string, PostRow[]>();
    for (const p of referentPosts) {
      const key = p.account_url ?? "desconocido";
      byAccount.set(key, [...(byAccount.get(key) ?? []), p]);
    }
    lines.push(`\n=== REFERENTES (para extraer patrones, no para copiar) ===\n`);
    for (const [url, posts] of byAccount) {
      lines.push(`-- ${url} --`);
      for (const p of posts.slice(0, 10)) {
        const eng = p.engagement
          ? Object.entries(p.engagement)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => `${k}:${v}`)
              .join(" ")
          : "";
        lines.push(`[${eng}] ${p.post_text.trim()}\n`);
      }
    }
  }

  return lines.join("\n");
}

export async function POST(req: Request) {
  let body: { userId?: string; platform?: string };
  try {
    body = (await req.json()) as { userId?: string; platform?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, platform } = body;

  if (!userId || !platform) {
    return NextResponse.json({ error: "Missing userId or platform" }, { status: 400 });
  }

  if (!(PLATFORM_KEYS as readonly string[]).includes(platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Leer TODOS los posts de esta plataforma (propios y referentes)
  const { data: posts, error: postsError } = await supabase
    .from("social_posts")
    .select("post_text, post_date, engagement, target, account_url")
    .eq("user_id", userId)
    .eq("platform", platform)
    .order("scraped_at", { ascending: false });

  if (postsError) {
    return NextResponse.json({ error: postsError.message }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ skipped: true, reason: "no posts" });
  }

  const ownPosts = (posts as PostRow[]).filter((p) => p.target === "own");
  const referentPosts = (posts as PostRow[]).filter((p) => p.target === "referent");

  const analysisPrompt = buildAnalysisPrompt(platform, ownPosts, referentPosts);

  // Resolver qué modelo usar: preferencia del usuario para "text" → fallback a Sonnet
  const { data: profilePrefs } = await supabase
    .from("profiles")
    .select("model_preferences")
    .eq("user_id", userId)
    .single();
  const prefs = sanitizePreferences(profilePrefs?.model_preferences);
  const modelId = effectiveModel("text", prefs) ?? MODELS.script;

  // Llamada a la IA para generar el ADN de contenido
  let contentDna: string;
  try {
    const { text } = await generateText({
      model: gatewayModel(modelId),
      system: SYNTHESIS_PROMPT,
      prompt: analysisPrompt,
    });
    contentDna = text.trim();
  } catch (e) {
    console.error("[synthesize] generateText error:", e);
    return NextResponse.json({ error: "AI synthesis failed" }, { status: 500 });
  }

  // Leer el social_insights actual del perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("social_insights")
    .eq("user_id", userId)
    .single();

  const currentInsights = (profile?.social_insights as Record<string, unknown>) ?? {};

  const updated = {
    ...currentInsights,
    [platform]: {
      synthesized_at: new Date().toISOString(),
      posts_analyzed: ownPosts.length,
      referents_analyzed: referentPosts.length,
      content_dna: contentDna,
    },
  };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ social_insights: updated })
    .eq("user_id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    platform,
    posts_analyzed: ownPosts.length,
    referents_analyzed: referentPosts.length,
    model_used: modelId,
  });
}
