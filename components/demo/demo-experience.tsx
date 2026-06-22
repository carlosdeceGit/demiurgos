"use client";

import { useState } from "react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { DemoChat } from "@/components/demo/demo-chat";
import { DemoDashboard } from "@/components/demo/demo-dashboard";
import { DemoAdmin } from "@/components/demo/demo-admin";
import {
  DEFAULT_DEMO_PROFILE_ID,
  DEMO_PROFILES,
  conversationFor,
} from "@/demo/fixtures";

type Tab = "chat" | "dashboard" | "admin";

const TABS: { id: Tab; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "dashboard", label: "Dashboard" },
  { id: "admin", label: "Panel admin" },
];

export function DemoExperience() {
  const [profileId, setProfileId] = useState(DEFAULT_DEMO_PROFILE_ID);
  const [tab, setTab] = useState<Tab>("chat");
  const conversation = conversationFor(profileId);

  return (
    <div className="flex h-dvh flex-col">
      {/* Banner de demo */}
      <div className="bg-brand-violet/10 text-brand-violet flex items-center justify-center gap-2 px-4 py-1.5 text-center text-xs">
        <span className="font-medium">Modo demo</span>
        <span className="opacity-80">
          · datos de ejemplo · el chat responde de verdad
        </span>
      </div>

      {/* Cabecera: marca + selector de perfil + tema */}
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-foreground text-background grid size-7 place-items-center rounded-lg font-serif text-lg italic">
            D
          </span>
          <span className="font-semibold tracking-tight">Demiurgos</span>
        </Link>

        <div className="ml-2 flex flex-wrap gap-1.5">
          {DEMO_PROFILES.map((p) => (
            <button
              key={p.id}
              onClick={() => setProfileId(p.id)}
              className={
                profileId === p.id
                  ? "bg-foreground text-background rounded-full px-3 py-1 text-xs font-medium"
                  : "bg-secondary hover:bg-secondary/70 rounded-full px-3 py-1 text-xs"
              }
              title={p.sector}
            >
              {p.displayName.split(" ")[0]}
              <span className="ml-1 opacity-60">· {p.sector}</span>
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 border-b px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "border-brand-accent text-foreground -mb-px border-b-2 px-3 py-2 text-sm font-medium"
                : "text-muted-foreground hover:text-foreground border-b-2 border-transparent px-3 py-2 text-sm"
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {tab === "chat" && (
          <div className="h-full">
            <DemoChat
              key={profileId}
              profileId={profileId}
              initial={conversation?.messages ?? []}
            />
          </div>
        )}
        {tab === "dashboard" && <DemoDashboard profileId={profileId} />}
        {tab === "admin" && <DemoAdmin />}
      </div>
    </div>
  );
}
