// Utilidades mínimas para trocear los .md fuente. No es un parser de Markdown
// completo: solo lo justo para mapear secciones de nivel 2 a datos.

export type Section = { heading: string; body: string };

// Divide un documento por sus encabezados de nivel 2 (`## `).
export function splitH2Sections(md: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of md.split("\n")) {
    const match = /^##\s+(.*)$/.exec(line);
    if (match) {
      if (current) sections.push(current);
      current = { heading: match[1].trim(), body: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) sections.push(current);

  return sections.map((s) => ({ heading: s.heading, body: s.body.trim() }));
}

// Devuelve el cuerpo de la primera sección cuyo encabezado casa con el patrón.
export function findSection(
  sections: Section[],
  pattern: RegExp
): string | null {
  const found = sections.find((s) => pattern.test(s.heading));
  return found ? found.body : null;
}

// Extrae el título de nivel 1 (`# `). Si tiene un guion largo, devuelve lo que
// hay después (p. ej. "PERFIL CREATIVO — Carlos Delgado" → "Carlos Delgado").
export function extractH1Name(md: string): string | null {
  for (const line of md.split("\n")) {
    const match = /^#\s+(.*)$/.exec(line);
    if (match) {
      const title = match[1].trim();
      const parts = title.split("—");
      return (parts.length > 1 ? parts[parts.length - 1] : title).trim();
    }
  }
  return null;
}
