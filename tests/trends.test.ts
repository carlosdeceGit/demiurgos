import { describe, expect, it } from "vitest";

import { parseSources, buildGrounding } from "@/lib/ai/trends/types";
import { buildTrendPrompt } from "@/lib/ai/agents/trend-analyst";

describe("parseSources", () => {
  it("preserva mayúsculas, dedupe (case-insensitive) y recorta a 4", () => {
    expect(
      parseSources(
        "TikTok Trending Hashtags, YouTube Trending , tiktok trending hashtags, Google Trends, Reddit Hot Posts"
      )
    ).toEqual([
      "TikTok Trending Hashtags",
      "YouTube Trending",
      "Google Trends",
      "Reddit Hot Posts",
    ]);
  });

  it("vacío o nulo devuelve []", () => {
    expect(parseSources("")).toEqual([]);
    expect(parseSources(null)).toEqual([]);
  });
});

describe("buildGrounding", () => {
  it("ignora fuentes sin datos y devuelve null si todas vacías", () => {
    expect(
      buildGrounding("trendsmcp", [{ source: "tiktok", text: "   " }])
    ).toBeNull();
  });

  it("compone el bloque con las fuentes con datos", () => {
    const g = buildGrounding("trendsmcp", [
      { source: "tiktok", text: "hashtag #x sube 30%" },
      { source: "reddit", text: "" },
    ]);
    expect(g).not.toBeNull();
    expect(g!.sourcesUsed).toEqual(["tiktok"]);
    expect(g!.text).toContain("## tiktok");
    expect(g!.text).toContain("hashtag #x sube 30%");
  });
});

describe("buildTrendPrompt", () => {
  it("inserta el grounding cuando existe", () => {
    const p = buildTrendPrompt(["tiktok"], "2026-06-23", "DATOS: #x sube");
    expect(p).toContain("DATOS: #x sube");
  });

  it("funciona sin grounding (solo-LLM)", () => {
    const p = buildTrendPrompt(["tiktok"], "2026-06-23");
    expect(p).toContain("2026-06-23");
    expect(p).not.toContain("DATOS:");
  });
});
