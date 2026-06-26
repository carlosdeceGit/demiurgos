"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { MetricCard } from "./metric-card";
import { BarChart } from "./bar-chart";
import { Button } from "@/components/ui/button";

type AnalyticsData = {
  summary: {
    totalUsers: number;
    activeUsers: number;
    newUsersLast30: number;
    totalRuns: number;
    totalCost: number;
    totalTokens: number;
  };
  runsByDay: Record<string, { runs: number; cost: number }>;
  runsByHour: number[];
  topUsers: { userId: string; displayName: string; runs: number; cost: number }[];
  modelList: { model: string; runs: number; cost: number; tokens: number }[];
  featureList: { role: string; count: number }[];
};

function SparkBar({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-12 items-end gap-px">
      {data.map((v, i) => (
        <div
          key={i}
          className="bg-primary/30 hover:bg-primary flex-1 rounded-t transition-colors"
          style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
          title={`${v} runs`}
        />
      ))}
    </div>
  );
}

export function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAnalytics() {
    const res = await fetch("/api/admin/analytics");
    if (res.ok) setData(await res.json());
  }

  async function load() {
    setLoading(true);
    try {
      await fetchAnalytics();
    } finally {
      setLoading(false);
    }
  }

  // Carga inicial: el primer setState ocurre tras el await (no es síncrono dentro
  // del effect) y `loading` ya arranca en true → sin renders en cascada.
  useEffect(() => {
    (async () => {
      try {
        await fetchAnalytics();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }
  if (!data) return <p className="text-muted-foreground text-sm">Error al cargar analíticas.</p>;

  // Últimos 30 días ordenados
  const days = Object.keys(data.runsByDay).sort();
  const dayRuns = days.map((d) => data.runsByDay[d].runs);

  const fmtCost = (v: number) => `$${v.toFixed(4)}`;
  const fmtNum = (v: number) => v.toLocaleString("es-ES");

  return (
    <div className="space-y-8">
      {/* Métricas principales */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Usuarios totales" value={fmtNum(data.summary.totalUsers)} />
        <MetricCard label="Activos (30d)" value={fmtNum(data.summary.activeUsers)} accent />
        <MetricCard label="Nuevos (30d)" value={fmtNum(data.summary.newUsersLast30)} />
        <MetricCard label="Runs totales" value={fmtNum(data.summary.totalRuns)} />
        <MetricCard label="Coste total" value={fmtCost(data.summary.totalCost)} accent />
        <MetricCard label="Tokens totales" value={fmtNum(data.summary.totalTokens)} />
      </section>

      {/* Actividad últimos 30 días */}
      <section className="bg-card rounded-xl border p-4">
        <h2 className="mb-3 text-sm font-semibold">Runs últimos 30 días</h2>
        {dayRuns.length > 0 ? (
          <>
            <SparkBar data={dayRuns} />
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground text-xs">{days[0]}</span>
              <span className="text-muted-foreground text-xs">{days[days.length - 1]}</span>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Sin datos.</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribución por hora */}
        <section className="bg-card rounded-xl border p-4">
          <h2 className="mb-3 text-sm font-semibold">Actividad por hora (UTC)</h2>
          <div className="flex h-16 items-end gap-0.5">
            {data.runsByHour.map((v, h) => {
              const max = Math.max(...data.runsByHour, 1);
              return (
                <div
                  key={h}
                  className="bg-brand-violet/40 hover:bg-brand-violet flex-1 rounded-t transition-colors"
                  style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
                  title={`${h}h: ${v} runs`}
                />
              );
            })}
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground text-xs">00h</span>
            <span className="text-muted-foreground text-xs">23h</span>
          </div>
        </section>

        {/* Modelos más usados */}
        <section className="bg-card rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Modelos IA</h2>
            <a
              href="/api/admin/export?type=usage"
              download
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
            >
              <Download className="size-3" /> CSV
            </a>
          </div>
          {data.modelList.length > 0 ? (
            <BarChart
              items={data.modelList.map((m) => ({
                label: m.model,
                value: m.runs,
                sub: `$${m.cost.toFixed(4)}`,
              }))}
              formatValue={fmtNum}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos.</p>
          )}
        </section>

        {/* Funcionalidades */}
        <section className="bg-card rounded-xl border p-4">
          <h2 className="mb-3 text-sm font-semibold">Uso por funcionalidad</h2>
          {data.featureList.length > 0 ? (
            <BarChart
              color="violet"
              items={data.featureList.map((f) => ({
                label: f.role,
                value: f.count,
              }))}
              formatValue={fmtNum}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos.</p>
          )}
        </section>

        {/* Top usuarios por gasto */}
        <section className="bg-card rounded-xl border p-4">
          <h2 className="mb-3 text-sm font-semibold">Top usuarios por gasto</h2>
          {data.topUsers.length > 0 ? (
            <BarChart
              color="amber"
              items={data.topUsers.map((u) => ({
                label: u.displayName,
                value: u.cost,
                sub: `${u.runs} runs`,
              }))}
              formatValue={fmtCost}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Sin datos.</p>
          )}
        </section>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={load} className="text-muted-foreground">
          <RefreshCw className="mr-1 size-3.5" />
          Actualizar
        </Button>
      </div>
    </div>
  );
}
