"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ThumbsUp,
  CheckCircle2,
} from "lucide-react";

import { calendarFor, type DemoCalendarEntry } from "@/demo/fixtures";

const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const TYPE_LABEL: Record<string, string> = {
  post_text: "Post",
  post_image: "Post + imagen",
  carousel: "Carrusel",
  video_script: "Guión",
  video_live: "Directo",
};

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const m = monday.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
  const s = sunday.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  return `${m} – ${s}`;
}

function dayFromSlot(slot: string | null): number | null {
  if (!slot) return null;
  const lower = slot.toLowerCase();
  const idx = DAY_NAMES.findIndex((d) => lower.startsWith(d));
  return idx >= 0 ? idx : null;
}

function timeFromSlot(slot: string | null): string | null {
  if (!slot) return null;
  const m = slot.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : null;
}

function entryDate(e: DemoCalendarEntry): string | null {
  if (!e.week_of) return null;
  const dayIdx = dayFromSlot(e.suggested_slot);
  if (dayIdx === null) return null;
  const monday = new Date(e.week_of + "T00:00:00");
  return toISO(addDays(monday, dayIdx));
}

function MiniCard({
  entry,
  onUpdate,
}: {
  entry: DemoCalendarEntry;
  onUpdate: (id: string, status: string) => void;
}) {
  const hook = entry.based_on?.hook ?? entry.idea;
  const isLiked = entry.status === "liked";
  const isExecuted = entry.status === "ejecutada";
  const time = timeFromSlot(entry.suggested_slot);

  return (
    <div
      className={`group relative flex flex-col gap-1 rounded-lg border p-2 text-xs transition-opacity ${
        isExecuted ? "opacity-50" : ""
      } ${isLiked ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
    >
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="font-mono">{entry.platform}</span>
        {entry.content_type && (
          <span className="font-mono">· {TYPE_LABEL[entry.content_type] ?? entry.content_type}</span>
        )}
        {time && <span className="ml-auto">{time}</span>}
      </div>
      <p className="line-clamp-2 text-[11px] leading-tight">{hook}</p>
      {!isExecuted && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 rounded-b-lg bg-card/90 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onUpdate(entry.id, isLiked ? "nueva" : "liked")}
            aria-label={isLiked ? "Quitar me gusta" : "Me gusta"}
            className={`rounded p-0.5 transition-colors ${
              isLiked ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <ThumbsUp className="size-3" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onUpdate(entry.id, "ejecutada")}
            aria-label="Ejecutada"
            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-primary"
          >
            <CheckCircle2 className="size-3" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

export function DemoCalendar({ profileId }: { profileId: string }) {
  const initial = calendarFor(profileId);
  const [entries, setEntries] = useState(initial);

  // Detectar la semana actual a partir de los datos.
  const weeks = Array.from(
    new Set(entries.map((e) => e.week_of).filter(Boolean))
  ).sort();
  const today = new Date();
  const currentMonday = toISO(mondayOf(today));
  const defaultWeek = weeks.includes(currentMonday) ? currentMonday : (weeks[0] ?? currentMonday);
  const [weekISO, setWeekISO] = useState(defaultWeek);

  const weekMonday = new Date(weekISO + "T00:00:00");
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i));

  const weekEntries = entries.filter((e) => e.week_of === weekISO);

  function prevWeek() {
    const prev = toISO(addDays(weekMonday, -7));
    setWeekISO(prev);
  }
  function nextWeek() {
    const next = toISO(addDays(weekMonday, 7));
    setWeekISO(next);
  }

  function handleUpdate(id: string, status: string) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  }

  const hasEntries = weekEntries.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <CalendarDays className="size-5 text-muted-foreground" aria-hidden />
        <h1 className="font-serif text-xl">Calendario editorial</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={prevWeek}
            aria-label="Semana anterior"
            className="rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="min-w-[200px] text-center text-sm font-medium">
            {formatWeekLabel(weekMonday)}
          </span>
          <button
            type="button"
            onClick={nextWeek}
            aria-label="Semana siguiente"
            className="rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <button
            disabled
            title="No disponible en modo demo"
            className="ml-2 flex cursor-not-allowed items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary opacity-50"
          >
            <Sparkles className="size-4" aria-hidden />
            Generar semana
          </button>
        </div>
      </div>

      {/* Cuadrícula semanal */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid min-w-[700px] grid-cols-7 gap-2">
          {/* Cabeceras de día */}
          {weekDays.map((day, i) => {
            const isToday = toISO(day) === toISO(today);
            return (
              <div key={i} className="pb-1 text-center">
                <p
                  className={`text-xs font-medium ${
                    isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {DAY_SHORT[i]}
                </p>
                <p
                  className={`text-sm ${
                    isToday
                      ? "font-bold text-primary"
                      : "text-foreground"
                  }`}
                >
                  {formatDayHeader(day)}
                </p>
              </div>
            );
          })}

          {/* Celdas con propuestas */}
          {weekDays.map((day, i) => {
            const dayStr = toISO(day);
            const dayEntries = weekEntries.filter((e) => entryDate(e) === dayStr);
            return (
              <div
                key={i}
                className="bg-muted/20 min-h-[120px] rounded-lg border border-border p-1.5"
              >
                <div className="flex flex-col gap-1.5">
                  {dayEntries.map((e) => (
                    <MiniCard key={e.id} entry={e} onUpdate={handleUpdate} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!hasEntries && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <CalendarDays className="size-10 text-primary/20" aria-hidden />
            <p className="font-serif text-lg text-muted-foreground">
              Sin propuestas para esta semana.
            </p>
            <p className="text-sm text-muted-foreground">
              Navega a la semana del 22 de junio para ver el calendario de ejemplo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
