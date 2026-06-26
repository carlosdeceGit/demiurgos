import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";

export const maxDuration = 30;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  const [
    { data: profile },
    { data: urlSources },
    { data: signals },
    { data: learning },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, positioning, pillars, audience, voice, tacit, goals, platforms, referents, social_insights"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("content_library")
      .select(
        "title, source_url, markdown_content, markdown_size, created_at, metadata_json"
      )
      .eq("user_id", user.id)
      .not("source_url", "is", null)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("signals")
      .select("content, type, source, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("proposals")
      .select("idea, platform, status, feedback_reason")
      .eq("user_id", user.id)
      .in("status", ["liked", "ejecutada"])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const name = profile?.display_name ?? user.email ?? "Usuario";
  const now = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const lines: string[] = [
    `# Lo que Demiurgos sabe de ${name}`,
    `*Generado el ${now}*`,
    "",
    "---",
    "",
  ];

  // Perfil
  lines.push("## Perfil");
  if (profile) {
    const jsonBlock = (label: string, value: unknown) => {
      if (!value) return null;
      if (Array.isArray(value) && value.length === 0) return null;
      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value as object).length === 0
      )
        return null;
      return `### ${label}\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
    };

    lines.push(`**Nombre:** ${name}`, "");

    const sections = [
      jsonBlock("Posicionamiento", profile.positioning),
      jsonBlock("Pilares de contenido", profile.pillars),
      jsonBlock("Audiencia", profile.audience),
      jsonBlock("Voz y tono", profile.voice),
      jsonBlock("Guía de estilo (datos tácitos)", profile.tacit),
      jsonBlock("Objetivos", profile.goals),
      jsonBlock("Plataformas", profile.platforms),
      jsonBlock("Referentes", profile.referents),
    ].filter(Boolean) as string[];

    lines.push(...sections);

    if (
      profile.social_insights &&
      Object.keys(profile.social_insights as object).length > 0
    ) {
      lines.push("", "### ADN de contenido (síntesis real de publicaciones)");
      for (const [platform, data] of Object.entries(
        profile.social_insights as Record<
          string,
          {
            synthesized_at: string;
            posts_analyzed: number;
            referents_analyzed: number;
            content_dna: string;
          }
        >
      )) {
        const meta = `${data.posts_analyzed} posts propios + ${data.referents_analyzed} de referentes`;
        lines.push(`\n#### ${platform.toUpperCase()} (${meta})\n${data.content_dna}`);
      }
    }
  } else {
    lines.push("*Perfil no configurado aún.*");
  }

  // Fuentes
  if (urlSources && urlSources.length > 0) {
    lines.push("", "---", "", "## Fuentes añadidas");
    for (const src of urlSources) {
      const date = new Date(src.created_at as string).toLocaleDateString("es-ES");
      const platform =
        (src.metadata_json as Record<string, string> | null)?.platform ?? "web";
      lines.push(`\n### ${src.title}`);
      lines.push(`*${platform} · ${date}*`);
      if (src.source_url) lines.push(`<${src.source_url}>`);
      if (src.markdown_content && (src.markdown_content as string).length > 0) {
        const content = src.markdown_content as string;
        const excerpt = content.slice(0, 2000);
        const truncated = content.length > 2000;
        lines.push("", excerpt + (truncated ? "\n\n*[contenido truncado...]*" : ""));
      }
    }
  }

  // Señales recientes
  if (signals && signals.length > 0) {
    lines.push("", "---", "", "## Señales recientes");
    for (const s of signals) {
      const date = new Date(s.created_at as string).toLocaleDateString("es-ES");
      const meta = [s.source, s.type, date].filter(Boolean).join(" · ");
      lines.push(`- ${meta ? `*(${meta})* ` : ""}${s.content}`);
    }
  }

  // Propuestas que han funcionado
  if (learning && learning.length > 0) {
    lines.push("", "---", "", "## Propuestas que han funcionado");
    for (const l of learning) {
      const tag = l.status === "ejecutada" ? "✓ ejecutada" : "👍 liked";
      lines.push(
        `- [${tag}] ${l.platform ? `${l.platform} · ` : ""}${l.idea ?? ""}`
      );
    }
  }

  const markdown = lines.join("\n");
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `demiurgos-contexto-${slug}-${dateStr}.md`;

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
