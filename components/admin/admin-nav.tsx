"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  ClipboardList,
  LayoutDashboard,
  Users,
} from "lucide-react";

const TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Usuarios", icon: Users, exact: false },
  { href: "/admin/analytics", label: "Analíticas", icon: BarChart2, exact: false },
  { href: "/admin/audit", label: "Auditoría", icon: ClipboardList, exact: false },
];

export function AdminNav() {
  const path = usePathname();

  return (
    <nav className="flex gap-1 border-b px-6">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-3 text-sm transition-colors",
              active
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
