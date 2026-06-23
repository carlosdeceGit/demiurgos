import { describe, expect, it } from "vitest";

import {
  effectiveModel,
  resolvePipelineModels,
  sanitizePreferences,
} from "@/lib/ai/resolve-models";
import { catalogDefault } from "@/lib/ai/model-catalog";

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
});
