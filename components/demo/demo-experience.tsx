"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FolderOpen,
  Home,
  LayoutGrid,
  Lightbulb,
  MessageSquare,
  Shield,
  User,
} from "lucide-react";

import { Logo } from "@/components/landing/logo";
import { DemoChat } from "@/components/demo/demo-chat";
import { DemoDashboard } from "@/components/demo/demo-dashboard";
import { DemoAdmin } from "@/components/demo/demo-admin";
import { DemoIdeas } from "@/components/demo/demo-ideas";
import { DemoPropuestas } from "@/components/demo/demo-propuestas";
import { DemoCalendar } from "@/components/demo/demo-calendar";
import { DemoBiblioteca } from "@/components/demo/demo-biblioteca";
import { DemoPerfil } from "@/components/demo/demo-perfil";
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
  { id: "admin", label: "Admin", icon: Shield },
];

export function DemoExperience() {
  const [profileId, setProfileId] = useState(DEFAULT_DEMO_PROFILE_ID);
  const [section, setSection] = useState<Section>("chat");
  const conversation = conversationFor(profileId);

  const profile = DEMO_PROFILES.find((p) => p.id === profileId);

  return (
    <div className="flex h-dvh flex-col">
      {/* ── Banner demo ─────────────────────────────────────────────── */}
      <div className="bg-brand-accent/10 border-b border-brand-accent/20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
        {/* Etiqueta izquierda */}
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
                // No reseteamos la sección para que el usuario vea el mismo apartado
                // pero con los datos del perfil nuevo.
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

        {/* CTA derecha */}
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

        {/* Contenido principal */}
        <main
          className={`flex-1 ${
            section === "calendario" || section === "chat"
              ? "overflow-hidden"
              : "overflow-y-auto"
          }`}
        >
          {section === "chat" && (
            <div className="h-full">
              <DemoChat
                key={profileId}
                profileId={profileId}
                initial={conversation?.messages ?? []}
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
          {section === "admin" && <DemoAdmin />}
        </main>
      </div>

      {/* Nav móvil (bottom bar) */}
      <nav
        className="border-t md:hidden"
        aria-label="Navegación móvil de demo"
      >
        <div className="flex">
          {NAV.filter((n) => ["dashboard", "chat", "propuestas", "perfil"].includes(n.id)).map(
            ({ id, label, icon: Icon }) => {
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
            }
          )}
        </div>
      </nav>
    </div>
  );
}
