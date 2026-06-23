import { describe, expect, it } from "vitest";

import {
  assembleCalendar,
  isoWeek,
  pickSelectedIdeas,
} from "@/lib/ai/orchestrator";
import type {
  Idea,
  ImageBrief,
  SchedulePlan,
  Script,
  Selection,
} from "@/lib/ai/agents/schemas";

function idea(overrides: Partial<Idea> = {}): Idea {
  return {
    topic: "Tema base",
    hook: "Hook que para el scroll",
    format: "carrusel",
    platform: "linkedin",
    angle: "educativo",
    pillar: "Pilar 1",
    why_now: "Encaja con la tendencia X",
    ...overrides,
  };
}

describe("isoWeek", () => {
  it("formatea la semana ISO como YYYY-Www", () => {
    expect(isoWeek(new Date("2026-06-23"))).toBe("2026-W26");
  });
});

describe("pickSelectedIdeas", () => {
  const ideas = [
    idea({ topic: "a" }),
    idea({ topic: "b" }),
    idea({ topic: "c" }),
  ];

  it("mapea índices válidos, dedupe y recorta a maxPosts", () => {
    const selection: Selection = {
      weekly_theme: "tema",
      editorial_note: "nota",
      selected: [
        { idea_index: 2, reason: "x" },
        { idea_index: 2, reason: "dup" },
        { idea_index: 0, reason: "y" },
      ],
    };
    const picked = pickSelectedIdeas(ideas, selection, 5);
    expect(picked.map((i) => i.topic)).toEqual(["c", "a"]);
  });

  it("ignora índices fuera de rango", () => {
    const selection: Selection = {
      weekly_theme: "t",
      editorial_note: "n",
      selected: [
        { idea_index: 99, reason: "x" },
        { idea_index: 1, reason: "y" },
      ],
    };
    expect(pickSelectedIdeas(ideas, selection, 5).map((i) => i.topic)).toEqual([
      "b",
    ]);
  });

  it("degrada a las primeras ideas si la selección es nula o vacía", () => {
    expect(pickSelectedIdeas(ideas, null, 2).map((i) => i.topic)).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("assembleCalendar", () => {
  const script: Script = {
    script: "guión",
    caption: "pie",
    hashtags: ["#a"],
    cta: "comenta",
    best_time: "09:00",
    format_notes: "notas",
  };
  const brief: ImageBrief = {
    image_prompt: "prompt",
    video_prompt: null,
    cover_description: "portada",
    aspect_ratio: "4:5",
    style_notes: "estilo",
  };

  it("cruza posts enriquecidos con el plan de agenda", () => {
    const enriched = [
      { idea: idea({ topic: "uno" }), script, brief, degraded: [] },
    ];
    const plan: SchedulePlan = {
      weekly_theme: "Tema final",
      notes: "nota final",
      schedule: [
        {
          post_index: 0,
          day: "martes",
          best_time: "18:00",
          rationale: "porque sí",
        },
      ],
    };
    const cal = assembleCalendar("2026-W26", "provisional", "", enriched, plan);
    expect(cal.weekly_theme).toBe("Tema final");
    expect(cal.posts[0].day).toBe("martes");
    expect(cal.posts[0].best_time).toBe("18:00"); // el plan gana al script
    expect(cal.posts[0].script).toBe("guión");
  });

  it("degrada con honestidad cuando faltan script/imagen", () => {
    const enriched = [
      {
        idea: idea({ topic: "roto" }),
        script: null,
        brief: null,
        degraded: ["script", "image_director"],
      },
    ];
    const cal = assembleCalendar("2026-W26", "tema", "nota", enriched, null);
    const post = cal.posts[0];
    expect(post.script).toBe("");
    expect(post.image_prompt).toBe("");
    expect(post.best_time).toBeNull();
    expect(post.degraded).toEqual(["script", "image_director"]);
    // sin plan, cae al weekly_theme provisional y a la nota editorial
    expect(cal.weekly_theme).toBe("tema");
    expect(cal.notes).toBe("nota");
  });
});
