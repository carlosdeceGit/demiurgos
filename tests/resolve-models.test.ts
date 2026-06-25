import { describe, expect, it } from "vitest";

import {
  competitorModel,
  effectiveModel,
  resolvePipelineModels,
  sanitizePreferences,
  type UserModelPreferences,
} from "@/lib/ai/resolve-models";
import { catalogDefault } from "@/lib/ai/model-catalog";

function prefs(p: Partial<UserModelPreferences> = {}): UserModelPreferences {
  return { models: {}, competitors: {}, ...p };
}

describe("sanitizePreferences", () => {
  it("formato nuevo: se queda con grupos válidos en models y competitors", () => {
    expect(
      sanitizePreferences({
        models: { orchestrator: "anthropic/claude-opus-4.8", text: "  " },
        competitors: { text: "google/gemini-2.5-flash", bogus: "x" },
      })
    ).toEqual({
      models: { orchestrator: "anthropic/claude-opus-4.8" },
      competitors: { text: "google/gemini-2.5-flash" },
    });
  });

  it("formato LEGADO (plano grupo→slug) se interpreta como models", () => {
    expect(
      sanitizePreferences({
        orchestrator: "anthropic/claude-opus-4.8",
        web: "google/gemini-2.5-flash",
      })
    ).toEqual({
      models: {
        orchestrator: "anthropic/claude-opus-4.8",
        web: "google/gemini-2.5-flash",
      },
      competitors: {},
    });
  });

  it("entrada no-objeto → vacío", () => {
    expect(sanitizePreferences(null)).toEqual({ models: {}, competitors: {} });
    expect(sanitizePreferences("nope")).toEqual({ models: {}, competitors: {} });
  });
});

describe("effectiveModel", () => {
  it("usa la preferencia del usuario si existe", () => {
    expect(
      effectiveModel("text", prefs({ models: { text: "deepseek/deepseek-v4-flash" } }))
    ).toBe("deepseek/deepseek-v4-flash");
  });

  it("cae al default del catálogo si no hay preferencia", () => {
    expect(effectiveModel("orchestrator", prefs())).toBe(
      catalogDefault("orchestrator")
    );
  });
});

describe("competitorModel", () => {
  it("texto compite por defecto con un rival distinto al elegido", () => {
    const c = competitorModel("text", prefs());
    expect(c).not.toBeNull();
    expect(c).not.toBe(effectiveModel("text", prefs()));
  });

  it("imagen/audio NO compiten por defecto (sin configurar)", () => {
    expect(competitorModel("image", prefs())).toBeNull();
    expect(competitorModel("audio", prefs())).toBeNull();
  });

  it("'off' desactiva la competición aunque el grupo compita por defecto", () => {
    expect(competitorModel("text", prefs({ competitors: { text: "off" } }))).toBeNull();
  });

  it("'auto' activa la competición con el rival recomendado (≠ elegido)", () => {
    const c = competitorModel("image", prefs({ competitors: { image: "auto" } }));
    expect(c).not.toBeNull();
    expect(c).not.toBe(effectiveModel("image", prefs()));
  });

  it("acepta cualquier slug del gateway como rival", () => {
    expect(
      competitorModel(
        "audio",
        prefs({ competitors: { audio: "openai/gpt-4.1" } })
      )
    ).toBe("openai/gpt-4.1");
  });

  it("nunca devuelve el mismo modelo que el principal", () => {
    const primary = "anthropic/claude-haiku-4.5";
    const c = competitorModel(
      "text",
      prefs({ models: { text: primary }, competitors: { text: primary } })
    );
    if (c !== null) expect(c).not.toBe(primary);
  });

  it("el orquestador (juez) no compite", () => {
    expect(
      competitorModel("orchestrator", prefs({ competitors: {} }))
    ).toBeNull();
  });
});

describe("resolvePipelineModels", () => {
  it("mapea grupos a roles e incluye competidores por productor", () => {
    const m = resolvePipelineModels(
      prefs({
        models: {
          orchestrator: "anthropic/claude-opus-4.8",
          text: "anthropic/claude-haiku-4.5",
          web: "google/gemini-3.1-pro-preview",
          image: "google/gemini-3.1-pro-preview",
          video: "google/gemini-3.1-pro-preview",
          audio: "anthropic/claude-haiku-4.5",
        },
      })
    );
    expect(m.idea).toBe("anthropic/claude-haiku-4.5");
    expect(m.script).toBe("anthropic/claude-haiku-4.5");
    expect(m.scriptCompetitor).not.toBe(m.script); // texto compite por defecto
    expect(m.imageCompetitor).toBeNull(); // imagen no, salvo que se active
    expect(m.video).toBe("google/gemini-3.1-pro-preview");
    expect(m.videoCompetitor).not.toBe(m.video); // vídeo compite por defecto
    expect(m.audioCompetitor).toBeNull();
  });

  it("con preferencias vacías usa todos los defaults del catálogo", () => {
    const m = resolvePipelineModels(prefs());
    expect(m.orchestrator).toBe(catalogDefault("orchestrator"));
    expect(m.idea).toBe(catalogDefault("text"));
    expect(m.trend).toBe(catalogDefault("web"));
    expect(m.imageDirector).toBe(catalogDefault("image"));
    expect(m.video).toBe(catalogDefault("video"));
    expect(m.audio).toBe(catalogDefault("audio"));
  });
});
