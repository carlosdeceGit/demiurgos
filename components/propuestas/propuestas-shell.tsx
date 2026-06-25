"use client";

import { useState } from "react";
import { LayoutGrid, CalendarDays } from "lucide-react";

import { ProposalsGrid, type ProposalRow } from "@/components/propuestas/proposals-grid";
import { CalendarClient, type CalendarProposal } from "@/components/calendar/calendar-client";

type Tab = "grid" | "calendario";

export function PropuestasShell({
  proposals,
  calendarProposals,
  defaultTab = "grid",
}: {
  proposals: ProposalRow[];
  calendarProposals: CalendarProposal[];
  defaultTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Selector de vista */}
      <div className="flex shrink-0 items-center gap-1 border-b px-6 pt-4 pb-0">
        <button
          type="button"
          onClick={() => setTab("grid")}
          aria-pressed={tab === "grid"}
          className={`flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition-colors ${
            tab === "grid"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutGrid className="size-3.5" />
          Propuestas
        </button>
        <button
          type="button"
          onClick={() => setTab("calendario")}
          aria-pressed={tab === "calendario"}
          className={`flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition-colors ${
            tab === "calendario"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="size-3.5" />
          Calendario
        </button>
      </div>

      {/* Contenido */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "grid" && (
          <div className="h-full overflow-y-auto">
            <ProposalsGrid proposals={proposals} />
          </div>
        )}
        {tab === "calendario" && (
          <CalendarClient proposals={calendarProposals} />
        )}
      </div>
    </div>
  );
}
