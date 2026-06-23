import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";
import {
  cleanMarkdown,
  classifyExtension,
  contentHash,
  convertText,
  deriveTitle,
  type ConversionOutcome,
} from "@/lib/library/convert";
import { ocrImageToMarkdown } from "@/lib/library/ocr";

export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

// POST — reprocesa una pieza.
//  - Si se conservó el original en Storage, re-convierte desde él (incl. OCR).
//  - Si no, re-normaliza el Markdown existente (limpia ruido, re-deriva título).
export async function POST(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  const { data: item, error } = await supabase
    .from("content_library")
    .select(
      "id, original_extension, original_mime_type, original_file_name, original_storage_path, markdown_content"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return new NextResponse(error.message, { status: 500 });
  if (!item) return new NextResponse("No encontrado", { status: 404 });

  const ext = (item.original_extension as string) ?? "txt";
  const fileName = (item.original_file_name as string) ?? "archivo";
  const storagePath = item.original_storage_path as string | null;

  let outcome: ConversionOutcome;

  if (storagePath) {
    // Re-conversión desde el original conservado.
    const { data: blob, error: dlErr } = await supabase.storage
      .from("library-originals")
      .download(storagePath);
    if (dlErr || !blob) {
      return new NextResponse(
        `No se pudo recuperar el original: ${dlErr?.message ?? "desconocido"}`,
        { status: 500 }
      );
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const kind = classifyExtension(ext);
    if (kind === "image") {
      outcome = await ocrImageToMarkdown({
        bytes,
        mimeType: (item.original_mime_type as string) || `image/${ext}`,
        fileName,
      });
    } else {
      outcome = convertText({
        text: new TextDecoder("utf-8").decode(bytes),
        ext,
        fileName,
      });
    }
  } else {
    // Sin original: re-normaliza el Markdown ya guardado.
    const existing = (item.markdown_content as string) ?? "";
    const md = cleanMarkdown(existing);
    outcome = md
      ? {
          status: "completed",
          markdown: md,
          tool: "renormalize",
          error: null,
          title: deriveTitle(md, fileName),
        }
      : {
          status: "needs_review",
          markdown: "",
          tool: "renormalize",
          error:
            "No hay contenido ni original para reprocesar. Edita el contenido a mano o vuelve a subir el archivo.",
          title: fileName,
        };
  }

  const md = outcome.markdown ?? "";
  const { error: upErr } = await supabase
    .from("content_library")
    .update({
      title: outcome.title,
      markdown_content: md,
      markdown_size: md.length,
      content_hash: md ? contentHash(md) : null,
      status: outcome.status,
      conversion_tool: outcome.tool,
      conversion_error: outcome.error,
    })
    .eq("id", id);

  if (upErr) return new NextResponse(upErr.message, { status: 500 });
  return NextResponse.json({ ok: true, status: outcome.status });
}
