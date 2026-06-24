import { describe, expect, it } from "vitest";

import {
  competitorModel,
  effectiveModel,
  resolvePipelineModels,
  sanitizePreferences,
} from "@/lib/ai/resolve-models";
import { catalogCompetitor, catalogDefault } from "@/lib/ai/model-catalog";

describe("sanitizePreferences", () => {
  it("se queda solo con grupos válidos y strings no vacíos", () => {
    expect(
      sanitizePreferences({
        orchestrator: "anthropic/claude-opus-4.8",
        text: "  ",
        web: "google/gemini-2.5-flash",
        bogus: "x",
      })
    ).toEqual({
      orchestrator: "anthropic/claude-opus-4.8",
      web: "google/gemini-2.5-flash",
    });
  });

  it("entrada no-objeto → {}", () => {
    expect(sanitizePreferences(null)).toEqual({});
    expect(sanitizePreferences("nope")).toEqual({});
  });
});

describe("effectiveModel", () => {
  it("usa la preferencia del usuario si existe", () => {
    expect(effectiveModel("text", { text: "deepseek/deepseek-v3" })).toBe(
      "deepseek/deepseek-v3"
    );
  });

  it("cae al default del catálogo si no hay preferencia", () => {
    expect(effectiveModel("orchestrator", {})).toBe(
      catalogDefault("orchestrator")
    );
  });
});

describe("resolvePipelineModels", () => {
  it("mapea grupos de tarea a roles del pipeline (idea y guión = texto)", () => {
    const models = resolvePipelineModels({
      orchestrator: "anthropic/claude-opus-4.8",
      text: "anthropic/claude-haiku-4.5",
      web: "google/gemini-3.1-pro",
      image: "google/gemini-3.1-pro",
    });
    expect(models.idea).toBe("anthropic/claude-haiku-4.5");
    expect(models.script).toBe("anthropic/claude-haiku-4.5");
    expect(models.trend).toBe("google/gemini-3.1-pro");
    expect(models.imageDirector).toBe("google/gemini-3.1-pro");
    expect(models.orchestrator).toBe("anthropic/claude-opus-4.8");
  });

  it("con preferencias vacías usa todos los defaults del catálogo", () => {
    const models = resolvePipelineModels({});
    expect(models.orchestrator).toBe(catalogDefault("orchestrator"));
    expect(models.idea).toBe(catalogDefault("text"));
    expect(models.trend).toBe(catalogDefault("web"));
    expect(models.imageDirector).toBe(catalogDefault("image"));
  });

  it("incluye scriptCompetitor (competición del guión) distinto del elegido", () => {
    const models = resolvePipelineModels({});
    expect(models.scriptCompetitor).toBe(competitorModel("text", {}));
    expect(models.scriptCompetitor).not.toBe(models.script);
  });
});

describe("competitorModel (competición del grupo texto)", () => {
  const rival = catalogCompetitor("text");
  const def = catalogDefault("text");

  it("texto compite: el rival difiere del modelo elegido", () => {
    expect(rival).not.toBeNull();
    expect(competitorModel("text", {})).toBe(rival);
    expect(competitorModel("text", {})).not.toBe(effectiveModel("text", {}));
  });

  it("si el usuario elige el propio rival, cae al default (sigue compitiendo)", () => {
    const c = competitorModel("text", { text: rival! });
    expect(c).toBe(def);
    expect(c).not.toBe(rival);
  });

  it("nunca devuelve el mismo modelo que el elegido por el usuario", () => {
    for (const choice of [def, rival!, "openai/gpt-4.1"]) {
      const c = competitorModel("text", { text: choice });
      if (c !== null) expect(c).not.toBe(choice);
    }
  });

  it("grupos sin competición devuelven null", () => {
    expect(competitorModel("web", {})).toBeNull();
    expect(competitorModel("image", {})).toBeNull();
  });
});
