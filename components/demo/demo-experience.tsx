"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  FolderOpen,
  Home,
  LayoutGrid,
  Lightbulb,
  MessageSquare,
  Plus,
  Shield,
  SlidersHorizontal,
  Sparkles,
  User,
} from "lucide-react";
import type { UIMessage } from "ai";

import { Logo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { DemoChat } from "@/components/demo/demo-chat";
import { DemoDashboard } from "@/components/demo/demo-dashboard";
import { DemoAdmin } from "@/components/demo/demo-admin";
import { DemoIdeas } from "@/components/demo/demo-ideas";
import { DemoPropuestas } from "@/components/demo/demo-propuestas";
import { DemoCalendar } from "@/components/demo/demo-calendar";
import { DemoBiblioteca } from "@/components/demo/demo-biblioteca";
import { DemoPerfil } from "@/components/demo/demo-perfil";
import { DemoSettings } from "@/components/demo/demo-settings";
import {
  DEFAULT_DEMO_PROFILE_ID,
  DEMO_PROFILES,
  conversationFor,
} from "@/demo/fixtures";

type Section =
  | "dashboard"
  | "chat"
  | "ideas"
  | "propuestas"
  | "calendario"
  | "biblioteca"
  | "perfil"
  | "ajustes"
  | "admin";

type NavItem = {
  id: Section;
  label: string;
  icon: typeof MessageSquare;
};

const NAV: NavItem[] = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "chat", label: "Director", icon: MessageSquare },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "propuestas", label: "Propuestas", icon: LayoutGrid },
  { id: "calendario", label: "Calendario", icon: CalendarDays },
  { id: "biblioteca", label: "Biblioteca", icon: FolderOpen },
  { id: "perfil", label: "Perfil", icon: User },
  { id: "ajustes", label: "Ajustes", icon: SlidersHorizontal },
  { id: "admin", label: "Admin", icon: Shield },
];

// ── Panel derecho: contexto de la conversación ─────────────────────────────

function extractContextPoints(messages: UIMessage[]): string[] {
  return messages
    .filter((m) => m.role === "user")
    .map((m) =>
      m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("")
        .trim()
    )
    .filter(Boolean)
    .slice(-4)
    .map((t) => (t.length > 80 ? t.slice(0, 80).trimEnd() + "…" : t));
}

function RailRight({ messages }: { messages: UIMessage[] }) {
  const points = extractContextPoints(messages);
  const hasContext = points.length > 0;

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-5 overflow-y-auto border-l p-5 xl:flex">
      <div>
        <h2 className="text-muted-foreground mb-3 font-mono text-xs tracking-wider uppercase">
          Esta conversación
        </h2>

        {hasContext ? (
          <ul className="flex flex-col gap-2">
            {points.map((pt, i) => (
              <li
                key={i}
                className="bg-card flex items-start gap-2 rounded-lg border px-3 py-2 text-xs"
              >
                <span className="bg-brand-accent mt-1.5 size-1.5 shrink-0 rounded-full" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-xs leading-relaxed">
            Los temas que traigas aparecerán aquí para que el Director los tenga
            siempre a la vista.
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <h3 className="text-muted-foreground mb-1 font-mono text-xs tracking-wider uppercase">
          Acciones rápidas
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          disabled
        >
          <BookOpen className="size-4" />
          Ir a Biblioteca
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          disabled
        >
          <Sparkles className="size-4" />
          Ver propuestas
        </Button>
      </div>
    </aside>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export function DemoExperience() {
  const [profileId, setProfileId] = useState(DEFAULT_DEMO_PROFILE_ID);
  const [section, setSection] = useState<Section>("chat");
  const [chatMessages, setChatMessages] = useState<UIMessage[]>([]);
  const handleMessages = useCallback((msgs: UIMessage[]) => setChatMessages(msgs), []);

  const conversation = conversationFor(profileId);
  const profile = DEMO_PROFILES.find((p) => p.id === profileId);

  const isFullHeight = section === "calendario" || section === "chat";

  return (
    <div className="flex h-dvh flex-col">
      {/* ── Banner demo ─────────────────────────────────────────────── */}
      <div className="bg-brand-accent/10 border-b border-brand-accent/20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-brand-accent/40 bg-brand-accent/10 px-2 py-0.5 text-[11px] font-semibold text-brand-accent tracking-wide uppercase">
            Modo demo
          </span>
          <span className="text-muted-foreground hidden sm:inline">
            datos de ejemplo · el chat responde de verdad con el perfil seleccionado
          </span>
        </div>

        {/* Selector de perfiles */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Selector de perfil de demo">
          {DEMO_PROFILES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProfileId(p.id);
                setChatMessages([]);
              }}
              aria-pressed={profileId === p.id}
              className={
                profileId === p.id
                  ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                  : "rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:border-primary/40 transition-colors"
              }
            >
              {p.displayName.split(" ")[0]}
              <span className="ml-1 opacity-60 text-[10px]">· {p.sector}</span>
            </button>
          ))}
        </div>

        <Link
          href="/login"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          Crear cuenta gratis →
        </Link>
      </div>

      {/* ── Layout principal ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="bg-muted/30 hidden w-56 shrink-0 flex-col border-r md:flex">
          {/* Marca */}
          <div className="flex items-center gap-2.5 px-5 py-4">
            <Logo size={26} />
            <span className="font-semibold tracking-tight">Demiurgos</span>
          </div>

          {/* CTA nueva conversación */}
          <div className="px-3 pb-2">
            <Button
              className="w-full justify-start gap-2 rounded-full"
              onClick={() => { setSection("chat"); setChatMessages([]); }}
            >
              <Plus className="size-4" />
              Nueva conversación
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5 px-3" aria-label="Navegación de demo">
            {NAV.map(({ id, label, icon: Icon }) => {
              const isActive = section === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "bg-accent text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-left w-full"
                      : "text-foreground hover:bg-accent/60 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-left w-full"
                  }
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Perfil en footer */}
          <div className="mt-auto border-t p-3">
            <div className="flex items-center gap-2">
              <span className="bg-secondary grid size-8 place-items-center rounded-full text-sm font-semibold">
                {profile?.displayName.charAt(0) ?? "?"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile?.displayName}</p>
                <p className="text-muted-foreground truncate text-xs">{profile?.sector}</p>
              </div>
            </div>
            <Link
              href="/login"
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </aside>

        {/* Contenido principal + panel derecho */}
        <div className="flex flex-1 overflow-hidden">
          <main className={`flex-1 ${isFullHeight ? "overflow-hidden" : "overflow-y-auto"}`}>
            {section === "chat" && (
              <div className="h-full">
                <DemoChat
                  key={profileId}
                  profileId={profileId}
                  initial={conversation?.messages ?? []}
                  onMessagesChange={handleMessages}
                />
              </div>
            )}
            {section === "dashboard" && (
              <DemoDashboard key={profileId} profileId={profileId} />
            )}
            {section === "ideas" && (
              <DemoIdeas key={profileId} profileId={profileId} />
            )}
            {section === "propuestas" && (
              <DemoPropuestas key={profileId} profileId={profileId} />
            )}
            {section === "calendario" && (
              <div className="h-full">
                <DemoCalendar key={profileId} profileId={profileId} />
              </div>
            )}
            {section === "biblioteca" && (
              <DemoBiblioteca key={profileId} profileId={profileId} />
            )}
            {section === "perfil" && (
              <DemoPerfil key={profileId} profileId={profileId} />
            )}
            {section === "ajustes" && (
              <DemoSettings displayName={profile?.displayName ?? "Demo"} />
            )}
            {section === "admin" && <DemoAdmin />}
          </main>

          {/* Panel derecho: solo visible en chat y solo en xl */}
          {section === "chat" && <RailRight messages={chatMessages} />}
        </div>
      </div>

      {/* Nav móvil (bottom bar) */}
      <nav className="border-t md:hidden" aria-label="Navegación móvil de demo">
        <div className="flex">
          {NAV.filter((n) =>
            ["dashboard", "chat", "propuestas", "perfil"].includes(n.id)
          ).map(({ id, label, icon: Icon }) => {
            const isActive = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-1 px-2 py-3 text-[10px] transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
