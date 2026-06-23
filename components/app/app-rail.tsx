import Link from "next/link";
import {
  CalendarDays,
  FolderOpen,
  Gauge,
  LayoutGrid,
  Lightbulb,
  LogOut,
  MessageSquare,
  Plus,
  Shield,
  User,
} from "lucide-react";

import { Logo } from "@/components/landing/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export type RailSection =
  | "chat"
  | "calendario"
  | "dashboard"
  | "biblioteca"
  | "ideas"
  | "propuestas"
  | "perfil"
  | "admin";

type NavItem = {
  id: RailSection;
  label: string;
  icon: typeof MessageSquare;
  href?: string; // si tiene href, es navegable; si no, "pronto"
};

const NAV: NavItem[] = [
  { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
  { id: "calendario", label: "Calendario", icon: CalendarDays, href: "/calendar" },
  { id: "dashboard", label: "Dashboard", icon: Gauge, href: "/dashboard" },
  { id: "biblioteca", label: "Biblioteca", icon: FolderOpen },
  { id: "ideas", label: "Banco de ideas", icon: Lightbulb },
  { id: "propuestas", label: "Propuestas", icon: LayoutGrid },
  { id: "perfil", label: "Perfil", icon: User },
];

export function AppRail({
  active,
  displayName,
  email,
  isAdmin = false,
}: {
  active: RailSection;
  displayName: string;
  email: string;
  isAdmin?: boolean;
}) {
  return (
    <aside className="bg-muted/30 hidden w-60 shrink-0 flex-col border-r md:flex">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-4">
        <Logo size={28} />
        <span className="font-semibold tracking-tight">Demiurgos</span>
      </Link>

      <div className="px-3">
        <Button asChild className="w-full justify-start gap-2 rounded-full">
          <Link href="/chat">
            <Plus className="size-4" />
            Nueva conversación
          </Link>
        </Button>
      </div>

      <nav className="mt-4 flex flex-col gap-0.5 px-3">
        {NAV.map(({ id, label, icon: Icon, href }) => {
          const isActive = id === active;
          if (href) {
            return (
              <Link
                key={id}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "bg-accent text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
                    : "text-foreground hover:bg-accent/60 flex items-center gap-3 rounded-md px-3 py-2 text-sm"
                }
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          }
          return (
            <span
              key={id}
              title="Próximamente"
              className="text-muted-foreground/70 flex cursor-default items-center gap-3 rounded-md px-3 py-2 text-sm"
            >
              <Icon className="size-4" />
              {label}
              <span className="bg-muted text-muted-foreground ml-auto rounded-full px-1.5 py-0.5 text-[10px]">
                pronto
              </span>
            </span>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            aria-current={active === "admin" ? "page" : undefined}
            className={
              active === "admin"
                ? "bg-accent text-accent-foreground mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium"
                : "text-foreground hover:bg-accent/60 mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm"
            }
          >
            <Shield className="size-4" />
            Admin
          </Link>
        )}
      </nav>

      <div className="mt-auto border-t p-3">
        <div className="flex items-center gap-2">
          <span className="bg-secondary grid size-8 place-items-center rounded-full text-sm font-medium">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="text-muted-foreground truncate text-xs">{email}</p>
          </div>
          <ThemeToggle />
        </div>
        <form action="/auth/signout" method="post" className="mt-2">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-muted-foreground w-full justify-start gap-2"
          >
            <LogOut className="size-4" />
            Salir
          </Button>
        </form>
      </div>
    </aside>
  );
}
