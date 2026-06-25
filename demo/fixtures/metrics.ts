import { DEMO_PROFILES } from "./profiles";
import type { DemoAiRun } from "./types";

// Genera corridas del consejo de IAs de los últimos 14 días, de forma
// determinista (sin aleatoriedad real, para que la demo sea estable).
const COUNCIL: { role: DemoAiRun["role"]; model: string; pricePerKTok: number }[] =
  [
    { role: "director", model: "openai/gpt-5.5", pricePerKTok: 0.01 },
    { role: "critico", model: "anthropic/claude-opus-4.8", pricePerKTok: 0.015 },
    { role: "analista", model: "google/gemini-3.1-pro-preview", pricePerKTok: 0.004 },
  ];

const BASE_DAY = Date.UTC(2026, 5, 22); // 2026-06-22
const DAYS = 14;

// LCG simple para variación reproducible.
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildRuns(): DemoAiRun[] {
  const rng = makeRng(42);
  const runs: DemoAiRun[] = [];
  let n = 0;

  for (let d = DAYS - 1; d >= 0; d--) {
    const date = new Date(BASE_DAY - d * 86400000).toISOString().slice(0, 10);
    for (const c of COUNCIL) {
      const count = 1 + Math.floor(rng() * 3); // 1..3 corridas por modelo y día
      for (let i = 0; i < count; i++) {
        const tokens = 800 + Math.floor(rng() * 3600);
        const cost = Number(((tokens / 1000) * c.pricePerKTok).toFixed(4));
        const profile = DEMO_PROFILES[Math.floor(rng() * DEMO_PROFILES.length)];
        runs.push({
          id: `run-${n++}`,
          profileId: profile.id,
          role: c.role,
          model: c.model,
          tokens,
          cost,
          date,
        });
      }
    }
  }
  return runs;
}

export const DEMO_AI_RUNS: DemoAiRun[] = buildRuns();

// ── Agregados para el panel admin ──────────────────────────────
export type CostByModel = { model: string; runs: number; tokens: number; cost: number };
export type CostByDay = { date: string; cost: number };
export type UserUsage = {
  profileId: string;
  displayName: string;
  sector: string;
  runs: number;
  cost: number;
};

export function totalCost(): number {
  return Number(DEMO_AI_RUNS.reduce((a, r) => a + r.cost, 0).toFixed(2));
}
export function totalTokens(): number {
  return DEMO_AI_RUNS.reduce((a, r) => a + r.tokens, 0);
}
export function costByModel(): CostByModel[] {
  const map = new Map<string, CostByModel>();
  for (const r of DEMO_AI_RUNS) {
    const m = map.get(r.model) ?? { model: r.model, runs: 0, tokens: 0, cost: 0 };
    m.runs += 1;
    m.tokens += r.tokens;
    m.cost = Number((m.cost + r.cost).toFixed(4));
    map.set(r.model, m);
  }
  return [...map.values()].sort((a, b) => b.cost - a.cost);
}
export function costByDay(): CostByDay[] {
  const map = new Map<string, number>();
  for (const r of DEMO_AI_RUNS) {
    map.set(r.date, Number(((map.get(r.date) ?? 0) + r.cost).toFixed(4)));
  }
  return [...map.entries()]
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
export function usageByUser(): UserUsage[] {
  return DEMO_PROFILES.map((p) => {
    const rows = DEMO_AI_RUNS.filter((r) => r.profileId === p.id);
    return {
      profileId: p.id,
      displayName: p.displayName,
      sector: p.sector,
      runs: rows.length,
      cost: Number(rows.reduce((a, r) => a + r.cost, 0).toFixed(2)),
    };
  });
}
