import { describe, expect, it } from "vitest";

import {
  composeSystemPrompt,
  type ComposeInput,
} from "@/lib/ai/compose-context";
import { activePlatformKeys } from "@/lib/ai/platforms";

const base: ComposeInput = {
  motor: "MOTOR_GENERICO: eres el director creativo.",
  profile: {
    display_name: "Ada Lovelace",
    positioning: { declaracion: "referente en computación" },
    pillars: { text: "algoritmos" },
    audience: { text: "ingenieras" },
    voice: { text: "precisa y directa" },
    tacit: { text: "odia el humo" },
    goals: { text: "autoridad" },
    platforms: [{ key: "linkedin", status: "activo" }],
    performance_patterns: [],
    referents: ["Babbage"],
  },
  knowledge: [{ platform: "linkedin", content: "En LinkedIn rinden los carruseles." }],
  signals: [{ content: "esta semana se habla de IA", type: "tendencia", source: "chat" }],
  messages: [
    { role: "user", content: "hola" },
    { role: "assistant", content: "qué tal" },
  ],
};

describe("composeSystemPrompt", () => {
  it("empieza por el motor", () => {
    const out = composeSystemPrompt(base);
    expect(out.startsWith(base.motor)).toBe(true);
  });

  it("incluye perfil, conocimiento, señales y memoria", () => {
    const out = composeSystemPrompt(base);
    expect(out).toContain("Ada Lovelace");
    expect(out).toContain("En LinkedIn rinden los carruseles.");
    expect(out).toContain("esta semana se habla de IA");
    expect(out).toContain("user: hola");
    expect(out).toContain("assistant: qué tal");
  });

  it("mantiene el orden de capas: motor → perfil → conocimiento → señales → memoria", () => {
    const out = composeSystemPrompt(base);
    const iMotor = out.indexOf("MOTOR_GENERICO");
    const iPerfil = out.indexOf("PERFIL DEL USUARIO");
    const iConoc = out.indexOf("CONOCIMIENTO DEL ECOSISTEMA");
    const iSignals = out.indexOf("SEÑALES RECIENTES");
    const iMem = out.indexOf("MEMORIA DE LA CONVERSACIÓN");
    expect(iMotor).toBeLessThan(iPerfil);
    expect(iPerfil).toBeLessThan(iConoc);
    expect(iConoc).toBeLessThan(iSignals);
    expect(iSignals).toBeLessThan(iMem);
  });

  it("sin perfil, sugiere onboarding y no rompe", () => {
    const out = composeSystemPrompt({ ...base, profile: null });
    expect(out).toContain("onboarding");
  });

  it("omite secciones vacías de conocimiento/señales/memoria", () => {
    const out = composeSystemPrompt({
      ...base,
      knowledge: [],
      signals: [],
      messages: [],
    });
    expect(out).not.toContain("CONOCIMIENTO DEL ECOSISTEMA");
    expect(out).not.toContain("SEÑALES RECIENTES");
    expect(out).not.toContain("MEMORIA DE LA CONVERSACIÓN");
  });
});

describe("activePlatformKeys", () => {
  it("devuelve solo las plataformas activas y normalizadas", () => {
    const keys = activePlatformKeys([
      { key: "linkedin", status: "activo" },
      { key: "x", status: "a decidir" },
      { key: "youtube", status: "Activo" },
    ]);
    expect(keys).toEqual(["linkedin", "youtube"]);
  });

  it("tolera entradas vacías o nulas", () => {
    expect(activePlatformKeys(null)).toEqual([]);
    expect(activePlatformKeys([])).toEqual([]);
  });
});
