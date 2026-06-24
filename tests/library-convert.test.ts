import { describe, expect, it } from "vitest";

import {
  classifyExtension,
  cleanMarkdown,
  contentHash,
  convertText,
  deriveTitle,
  htmlToMarkdown,
  isSupportedExtension,
  normalizeTxtToMarkdown,
  validateMarkdown,
} from "@/lib/library/convert";

describe("classifyExtension", () => {
  it("clasifica los formatos por familia", () => {
    expect(classifyExtension("md")).toBe("native-md");
    expect(classifyExtension("markdown")).toBe("native-md");
    expect(classifyExtension("txt")).toBe("native-txt");
    expect(classifyExtension("html")).toBe("html");
    expect(classifyExtension("jpg")).toBe("image");
    expect(classifyExtension("PNG")).toBe("image");
    expect(classifyExtension("pdf")).toBe("external");
    expect(classifyExtension("xyz")).toBe("unknown");
  });
});

describe("isSupportedExtension", () => {
  it("acepta nativos, imágenes, convertibles y externos", () => {
    for (const e of ["md", "txt", "jpg", "png", "html", "pdf", "docx"]) {
      expect(isSupportedExtension(e)).toBe(true);
    }
    expect(isSupportedExtension("exe")).toBe(false);
  });
});

describe("cleanMarkdown", () => {
  it("normaliza saltos, recorta y colapsa líneas en blanco", () => {
    expect(cleanMarkdown("a  \r\n\r\n\r\n\r\nb   ")).toBe("a\n\nb");
  });
});

describe("normalizeTxtToMarkdown", () => {
  it("preserva el contenido del texto plano", () => {
    const out = normalizeTxtToMarkdown("Hola\n\nMundo\n");
    expect(out).toBe("Hola\n\nMundo");
  });
});

describe("validateMarkdown", () => {
  it("acepta markdown válido", () => {
    expect(validateMarkdown("# Título\n\ntexto")).toContain("# Título");
  });
  it("rechaza un markdown vacío", () => {
    expect(() => validateMarkdown("   \n  ")).toThrow();
  });
});

describe("htmlToMarkdown", () => {
  it("convierte encabezados, negrita, enlaces y listas", () => {
    const html =
      "<h1>Hola</h1><p>Esto es <strong>negrita</strong> y <a href='https://x.com'>link</a></p><ul><li>uno</li><li>dos</li></ul>";
    const md = htmlToMarkdown(html);
    expect(md).toContain("# Hola");
    expect(md).toContain("**negrita**");
    expect(md).toContain("[link](https://x.com)");
    expect(md).toContain("- uno");
    expect(md).toContain("- dos");
  });

  it("elimina scripts y estilos", () => {
    const md = htmlToMarkdown("<style>.a{}</style><script>x()</script><p>visible</p>");
    expect(md).toBe("visible");
  });
});

describe("deriveTitle", () => {
  it("usa el primer encabezado", () => {
    expect(deriveTitle("# Mi título\n\ntexto", "fallback")).toBe("Mi título");
  });
  it("usa la primera línea no vacía si no hay encabezado", () => {
    expect(deriveTitle("\n\nPrimera línea\nsegunda", "fallback")).toBe("Primera línea");
  });
  it("recurre al fallback si está vacío", () => {
    expect(deriveTitle("   \n  ", "archivo.txt")).toBe("archivo.txt");
  });
});

describe("convertText", () => {
  it("convierte .txt a markdown completado", () => {
    const r = convertText({ text: "Hola mundo", ext: "txt", fileName: "n.txt" });
    expect(r.status).toBe("completed");
    expect(r.markdown).toBe("Hola mundo");
    expect(r.tool).toBe("txt-normalize");
  });

  it("falla con markdown vacío", () => {
    const r = convertText({ text: "  ", ext: "md", fileName: "n.md" });
    expect(r.status).toBe("failed");
    expect(r.markdown).toBeNull();
  });

  it("marca formatos no textuales como failed", () => {
    const r = convertText({ text: "x", ext: "pdf", fileName: "n.pdf" });
    expect(r.status).toBe("failed");
  });
});

describe("contentHash", () => {
  it("es estable y distinto según el contenido", () => {
    expect(contentHash("a")).toBe(contentHash("a"));
    expect(contentHash("a")).not.toBe(contentHash("b"));
  });
});
