import { generateText } from "ai";

import { gatewayModel } from "@/lib/ai/gateway";
import { cleanMarkdown, deriveTitle, type ConversionOutcome } from "./convert";

// ─────────────────────────────────────────────────────────────
// OCR de imágenes → Markdown.
//
// Infraestructura: REUTILIZAMOS la capa de IA existente (Vercel AI Gateway), que
// ya da acceso a modelos de visión (Claude). No añadimos dependencias ni un
// servicio OCR aparte. El modelo es configurable por entorno (LIBRARY_OCR_MODEL);
// por defecto un modelo de visión capaz.
//
// Punto de integración: si se prefiere un OCR clásico (Google Vision, Tesseract,
// AWS Textract), sustituir el cuerpo de `ocrImageToMarkdown` por la llamada al
// proveedor. La firma y el contrato de salida (ConversionOutcome) no cambian.
// ─────────────────────────────────────────────────────────────

const OCR_MODEL = process.env.LIBRARY_OCR_MODEL ?? "anthropic/claude-sonnet-4.6";

// ¿Hay infraestructura para OCR? Sin AI Gateway key, no.
export function ocrAvailable(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

const OCR_PROMPT = [
  "Eres un OCR. Transcribe EXACTAMENTE todo el texto visible en la imagen y",
  "devuélvelo en Markdown limpio, preservando títulos, listas y jerarquía.",
  "Reglas estrictas:",
  "- No inventes ni añadas contenido que no esté en la imagen.",
  "- No resumas: transcribe íntegro.",
  "- Si no hay texto legible, responde solo con: [SIN_TEXTO]",
  "Devuelve únicamente el Markdown, sin comentarios ni explicaciones.",
].join("\n");

export async function ocrImageToMarkdown({
  bytes,
  mimeType,
  fileName,
}: {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
}): Promise<ConversionOutcome> {
  if (!ocrAvailable()) {
    return {
      status: "needs_review",
      markdown: "",
      tool: "ocr-vision",
      error:
        "OCR no disponible: falta AI_GATEWAY_API_KEY. El archivo se guardó como pendiente de revisión.",
      title: fileName,
    };
  }

  try {
    const { text } = await generateText({
      model: gatewayModel(OCR_MODEL),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: OCR_PROMPT },
            { type: "image", image: bytes, mediaType: mimeType },
          ],
        },
      ],
    });

    const raw = (text ?? "").trim();
    if (!raw || raw === "[SIN_TEXTO]") {
      return {
        status: "needs_review",
        markdown: "",
        tool: "ocr-vision",
        error: "No se detectó texto en la imagen. Revisa el original.",
        title: fileName,
      };
    }

    const markdown = cleanMarkdown(raw);
    return {
      status: "completed",
      markdown,
      tool: "ocr-vision",
      error: null,
      title: deriveTitle(markdown, fileName),
    };
  } catch (err) {
    return {
      status: "failed",
      markdown: null,
      tool: "ocr-vision",
      error: err instanceof Error ? err.message : String(err),
      title: fileName,
    };
  }
}
