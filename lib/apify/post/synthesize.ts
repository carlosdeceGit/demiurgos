// Genera la síntesis del Director para un perfil o canal scrapeado.
// El resultado es lo que se guarda en markdown_content y lo que el Director
// leerá como contexto cuando el usuario pida propuestas.

import { generateText } from "ai";
import { gatewayModel } from "@/lib/ai/gateway";
import type { NormalizedPost, SocialPlatform } from "./types";

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X / Twitter",
  facebook: "Facebook",
};

const SYNTHESIS_PROMPT = `Eres un analista de contenido experto. Analiza el historial de publicaciones de un perfil/canal de referencia y genera un informe compacto y accionable.

El informe debe cubrir exactamente estos apartados (en español, texto plano, sin markdown):

VOZ Y ESTILO
Cómo escribe/comunica este creador: longitud típica, estructura habitual, nivel de formalidad, uso del humor, expresiones que repite, lo que nunca hace.

TEMAS RECURRENTES
Los 5-8 temas principales que aparecen, con el peso aproximado de cada uno.

PATRONES DE HOOK
Los 3-5 tipos de apertura que más usa (con ejemplos literales si los hay).

FORMATOS QUE DOMINA
Qué tipo de piezas produce más y cómo las estructura.

QUÉ RESUENA CON SU AUDIENCIA
Basándote en el engagement visible, qué tipo de contenido genera más respuesta y por qué.

QUÉ SE PUEDE APRENDER
Patrones concretos que el usuario podría adaptar a su propia estrategia. Sé específico.

SÍNTESIS EN UNA FRASE
Una sola frase que capture la esencia del contenido de este perfil.

Sé específico y usa ejemplos reales de los posts. No generalices. No inventes nada que no esté en los textos.`;

function formatPostsForPrompt(posts: NormalizedPost[]): string {
  return posts
    .map((p, i) => {
      const stats = Object.entries(p.stats)
        .filter(([, v]) => v && (v as number) > 0)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      const meta = [p.publishedAt, stats].filter(Boolean).join(" · ");
      const transcript = p.transcript ? `\n[Transcripción: ${p.transcript.slice(0, 400)}]` : "";
      return `--- Post ${i + 1} ${meta ? `(${meta})` : ""}\n${p.text.slice(0, 600)}${transcript}`;
    })
    .join("\n\n");
}

export async function synthesizeProfile(
  posts: NormalizedPost[],
  platform: SocialPlatform,
  handle: string | undefined,
  existingSynthesis?: string
): Promise<string> {
  const platformLabel = PLATFORM_LABELS[platform];
  const who = handle ?? "este perfil";

  const contextNote = existingSynthesis
    ? `\n\nANÁLISIS PREVIO (actualiza y enriquece, no ignores lo que ya sabías):\n${existingSynthesis}\n`
    : "";

  const userMessage =
    `Analiza los siguientes ${posts.length} posts de ${who} en ${platformLabel}.${contextNote}\n\n` +
    formatPostsForPrompt(posts);

  const { text } = await generateText({
    model: gatewayModel("anthropic/claude-haiku-4.5"),
    system: SYNTHESIS_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  return text.trim();
}
