import { NextResponse } from "next/server";

import { createClient } from "@/lib/db/server";
import {
  classifyExtension,
  contentHash,
  convertText,
  isSupportedExtension,
  type ConversionOutcome,
} from "@/lib/library/convert";
import { ocrImageToMarkdown } from "@/lib/library/ocr";
import {
  CONTENT_LIST_COLUMNS,
  mapContentItem,
} from "@/lib/library/queries";
import { MAX_FILE_BYTES, extensionOf } from "@/lib/library/types";

// La OCR de imágenes puede tardar (llamada a modelo de visión); damos margen.
export const maxDuration = 120;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autenticado", { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new NextResponse("Cuerpo no válido (se esperaba multipart)", {
      status: 400,
    });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return new NextResponse("Falta el archivo", { status: 400 });
  }

  // Validación de tamaño.
  if (file.size > MAX_FILE_BYTES) {
    return new NextResponse(
      `El archivo supera el máximo de ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB.`,
      { status: 413 }
    );
  }
  if (file.size === 0) {
    return new NextResponse("El archivo está vacío.", { status: 400 });
  }

  const fileName = file.name || "archivo";
  const ext = extensionOf(fileName);
  if (!ext) {
    return new NextResponse("El archivo no tiene extensión reconocible.", {
      status: 415,
    });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = classifyExtension(ext);

  // Conversión según el tipo.
  let outcome: ConversionOutcome;
  if (kind === "native-md" || kind === "native-txt" || kind === "html") {
    const text = new TextDecoder("utf-8").decode(bytes);
    outcome = convertText({ text, ext, fileName });
  } else if (kind === "image") {
    outcome = await ocrImageToMarkdown({
      bytes,
      mimeType: file.type || `image/${ext}`,
      fileName,
    });
  } else if (kind === "external") {
    // pdf/docx/rtf/odt: requieren un servicio externo (punto de integración).
    outcome = {
      status: "needs_review",
      markdown: "",
      tool: null,
      error: `Formato .${ext} reconocido pero la conversión automática requiere un servicio externo (ver docs/CONTENT_LIBRARY.md). Se ha registrado para que puedas pegar el contenido o reprocesar cuando esté disponible.`,
      title: fileName,
    };
  } else {
    return new NextResponse(
      `Formato .${ext} no soportado. ${isSupportedExtension(ext) ? "" : "Sube .md, .txt, .html o imágenes (.jpg/.png)."}`,
      { status: 415 }
    );
  }

  const markdown = outcome.markdown ?? "";

  const { data, error } = await supabase
    .from("content_library")
    .insert({
      user_id: user.id,
      title: outcome.title,
      original_file_name: fileName,
      original_mime_type: file.type || null,
      original_extension: ext,
      original_size: file.size,
      source_type: "manual_upload",
      markdown_content: markdown,
      markdown_size: markdown.length,
      content_hash: markdown ? contentHash(markdown) : null,
      status: outcome.status,
      conversion_tool: outcome.tool,
      conversion_error: outcome.error,
      metadata_json: { uploaded_via: "manual" },
    })
    .select(CONTENT_LIST_COLUMNS)
    .single();

  if (error) {
    return new NextResponse(`No se pudo guardar: ${error.message}`, {
      status: 500,
    });
  }

  return NextResponse.json({ item: mapContentItem(data) });
}
