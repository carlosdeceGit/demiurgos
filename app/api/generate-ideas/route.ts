import { createClient } from "@/lib/db/server";
import { gatewayModel } from "@/lib/ai/gateway";
import { gatherContext } from "@/lib/ai/compose-context";
import { getModelSettings } from "@/lib/db/settings";
import { generateObject } from "ai";
import { z } from "zod";
import { redirect } from "next/navigation";

export const maxDuration = 45;

const IdeaSchema = z.object({
  ideas: z.array(
    z.object({
      idea: z.string(),
      why_interesting: z.string(),
      platform: z.string(),
      content_type: z.enum([
        "post_text",
        "post_image",
        "carousel",
        "video_script",
        "video_live",
        "music",
        "mixed",
      ]),
    })
  ),
});

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const context = await gatherContext(supabase, user.id);
  const { ideaModel } = await getModelSettings();

  const systemPrompt =
    context.motor.trim() +
    "\n\n# TAREA\nGenera exactamente 10 ideas de contenido diversas y concretas para este perfil. " +
    "Cada idea debe ser accionable, variar en formato y plataforma, y aprovechar las señales recientes si las hay. " +
    "Responde SOLO con el JSON estructurado, sin texto adicional.";

  const profileSnippet = context.profile
    ? `Nombre: ${context.profile.display_name}
Plataformas activas: ${JSON.stringify(context.profile.platforms)}
Pilares: ${JSON.stringify(context.profile.pillars)}
Voz: ${JSON.stringify(context.profile.voice)}`
    : "Sin perfil todavía.";

  const signalsSnippet =
    context.signals.length > 0
      ? "Señales recientes:\n" + context.signals.map((s) => `- ${s.content}`).join("\n")
      : "";

  const learningSnippet =
    context.learning.length > 0
      ? "Feedback previo (liked/ejecutadas):\n" +
        context.learning
          .filter((l) => l.status === "liked" || l.status === "ejecutada")
          .slice(0, 10)
          .map((l) => `- [${l.status}] ${l.platform}: ${l.idea}`)
          .join("\n")
      : "";

  const userPrompt = [profileSnippet, signalsSnippet, learningSnippet]
    .filter(Boolean)
    .join("\n\n");

  const { object } = await generateObject({
    model: gatewayModel(ideaModel),
    system: systemPrompt,
    prompt: userPrompt,
    schema: IdeaSchema,
  });

  // Guardar las 10 ideas en la BD con un generation_id compartido
  const generationId = crypto.randomUUID();
  const rows = object.ideas.map((idea) => ({
    user_id: user.id,
    generation_id: generationId,
    idea: idea.idea,
    why_interesting: idea.why_interesting,
    platform: idea.platform,
    content_type: idea.content_type,
    status: "nueva" as const,
  }));

  await supabase.from("ideas").insert(rows);

  return Response.json({ generationId, count: rows.length });
}
