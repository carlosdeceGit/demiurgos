import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseConocimiento } from "@/seed/parse-conocimiento";
import { mapPerfil } from "@/seed/map-perfil";
import { activePlatformKeys, PLATFORM_KEYS } from "@/lib/ai/platforms";

const SPEC = path.join(process.cwd(), "v1-proyecto-claude");
const read = (file: string) => readFileSync(path.join(SPEC, file), "utf8");

describe("parseConocimiento", () => {
  const rows = parseConocimiento(read("CONOCIMIENTO_REDES.md"));

  it("produce exactamente una fila por cada una de las 6 redes", () => {
    expect(rows).toHaveLength(6);
    const keys = rows.map((r) => r.platform).sort();
    expect(keys).toEqual([...PLATFORM_KEYS].sort());
  });

  it("cada fila lleva el contenido real de su ficha", () => {
    const linkedin = rows.find((r) => r.platform === "linkedin");
    expect(linkedin?.content).toContain("Saves");
    const x = rows.find((r) => r.platform === "x");
    expect(x?.content.toLowerCase()).toContain("conversación");
  });
});

describe("mapPerfil (PERFIL_CARLOS.md)", () => {
  const profile = mapPerfil(read("PERFIL_CARLOS.md"));

  it("extrae el nombre desde el título, sin hardcodear", () => {
    expect(profile.display_name).toBe("Carlos Delgado");
  });

  it("usa el texto real del perfil en las secciones", () => {
    expect(profile.voice.text).toContain("raya larga");
    expect(profile.positioning.declaracion).toContain("referencia");
  });

  it("estructura las plataformas y detecta las activas", () => {
    const active = activePlatformKeys(profile.platforms);
    expect(active).toContain("linkedin");
    expect(active).toContain("youtube");
    expect(active).toContain("substack");
    expect(active).not.toContain("x");
  });

  it("parsea los referentes como lista no vacía", () => {
    expect(profile.referents.length).toBeGreaterThan(0);
  });
});
