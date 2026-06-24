import { describe, expect, it } from "vitest";

import {
  applyHookReview,
  assembleCalendar,
  balanceSelection,
  isoWeek,
  pickSelectedIdeas,
  producersFor,
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
    content_type: "post_text",
    content_category: "educational",
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

describe("producersFor", () => {
  it("post_text solo necesita guión", () => {
    expect(producersFor("post_text")).toEqual({
      script: true,
      image: false,
      video: false,
      audio: false,
    });
  });

  it("carousel necesita guión + imagen, no vídeo/audio", () => {
    expect(producersFor("carousel")).toEqual({
      script: true,
      image: true,
      video: false,
      audio: false,
    });
  });

  it("video_script activa los cuatro productores", () => {
    expect(producersFor("video_script")).toEqual({
      script: true,
      image: true,
      video: true,
      audio: true,
    });
  });

  it("music activa guión + imagen + audio (no vídeo)", () => {
    expect(producersFor("music")).toEqual({
      script: true,
      image: true,
      video: false,
      audio: true,
    });
  });

  it("tipo desconocido produce todo (degradación segura)", () => {
    expect(producersFor("???")).toEqual({
      script: true,
      image: true,
      video: true,
      audio: true,
    });
  });
});

describe("balanceSelection", () => {
  it("recorta el exceso de promotional a 2 y conserva el orden y el resto", () => {
    const list = [
      idea({ topic: "edu", content_category: "educational" }),
      idea({ topic: "p1", content_category: "promotional" }),
      idea({ topic: "info", content_category: "informative" }),
      idea({ topic: "p2", content_category: "promotional" }),
      idea({ topic: "p3", content_category: "promotional" }),
      idea({ topic: "ent", content_category: "entertainment" }),
    ];
    const out = balanceSelection(list);
    const topics = out.map((i) => i.topic);
    expect(topics).toEqual(["edu", "p1", "info", "p2", "ent"]); // p3 fuera
    expect(out.filter((i) => i.content_category === "promotional")).toHaveLength(2);
  });

  it("no toca un lote sin exceso de promotional", () => {
    const list = [
      idea({ content_category: "educational" }),
      idea({ content_category: "promotional" }),
    ];
    expect(balanceSelection(list)).toHaveLength(2);
  });
});

describe("applyHookReview", () => {
  const ideas = [
    idea({ topic: "a", hook: "hook flojo A" }),
    idea({ topic: "b", hook: "hook flojo B" }),
  ];

  it("sustituye el hook por el final que devuelve el orquestador, por índice", () => {
    const out = applyHookReview(ideas, {
      hooks: [
        { index: 0, score: 4, hook: "Hook reescrito brutal", reason: "flojo" },
        { index: 1, score: 8, hook: "hook flojo B", reason: "ok" },
      ],
    });
    expect(out[0].hook).toBe("Hook reescrito brutal");
    expect(out[1].hook).toBe("hook flojo B"); // sin cambios
    expect(out[0].topic).toBe("a"); // no toca el resto de la idea
  });

  it("sin revisión (null) deja las ideas intactas", () => {
    expect(applyHookReview(ideas, null)).toEqual(ideas);
  });

  it("ignora hooks vacíos y los índices fuera de rango", () => {
    const out = applyHookReview(ideas, {
      hooks: [
        { index: 0, score: 3, hook: "   ", reason: "vacío" },
        { index: 9, score: 2, hook: "fuera", reason: "no existe" },
      ],
    });
    expect(out[0].hook).toBe("hook flojo A"); // vacío → no sustituye
    expect(out).toHaveLength(2);
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
    slides: null,
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
      {
        idea: idea({ topic: "uno" }),
        script,
        brief,
        video: null,
        audio: null,
        degraded: [],
      },
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
    expect(cal.posts[0].content_type).toBe("post_text"); // taxonomía propagada
    expect(cal.posts[0].content_category).toBe("educational");
  });

  it("degrada con honestidad cuando faltan script/imagen", () => {
    const enriched = [
      {
        idea: idea({ topic: "roto" }),
        script: null,
        brief: null,
        video: null,
        audio: null,
        degraded: ["script", "image_director", "video", "audio"],
      },
    ];
    const cal = assembleCalendar("2026-W26", "tema", "nota", enriched, null);
    const post = cal.posts[0];
    expect(post.script).toBe("");
    expect(post.image_prompt).toBe("");
    expect(post.video_brief).toBeNull();
    expect(post.audio_brief).toBeNull();
    expect(post.best_time).toBeNull();
    expect(post.degraded).toEqual([
      "script",
      "image_director",
      "video",
      "audio",
    ]);
    // sin plan, cae al weekly_theme provisional y a la nota editorial
    expect(cal.weekly_theme).toBe("tema");
    expect(cal.notes).toBe("nota");
  });
});
