"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Download, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";

type User = {
  id: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  totalRuns: number;
  totalCost: number;
  modelsUsed: string[];
  lastActivity: string | null;
  usageLimit: number | null;
  spendLimit: number | null;
};

type SortKey = "email" | "createdAt" | "lastLoginAt" | "totalRuns" | "totalCost" | "lastActivity";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type SortState = { key: SortKey; dir: "asc" | "desc" };

// Cabecera ordenable. Declarada a nivel de módulo (no dentro del render) para no
// recrear el componente en cada render; recibe el estado de orden por props.
function SortIcon({ k, sort }: { k: SortKey; sort: SortState }) {
  if (sort.key !== k) return <ChevronUp className="size-3 opacity-20" />;
  return sort.dir === "asc" ? (
    <ChevronUp className="text-primary size-3" />
  ) : (
    <ChevronDown className="text-primary size-3" />
  );
}

function Th({
  k,
  children,
  className = "",
  sort,
  onSort,
}: {
  k: SortKey;
  children: React.ReactNode;
  className?: string;
  sort: SortState;
  onSort: (k: SortKey) => void;
}) {
  return (
    <th
      className={[
        "cursor-pointer select-none px-4 py-2 text-left text-xs font-medium",
        className,
      ].join(" ")}
      onClick={() => onSort(k)}
    >
      <span className="flex items-center gap-1">
        {children}
        <SortIcon k={k} sort={sort} />
      </span>
    </th>
  );
}

export function UsersTableClient({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortState>({
    key: "totalCost",
    dir: "desc",
  });

  const filtered = useMemo(() => {
    let list = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q) ||
          u.id.includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((u) => u.status === statusFilter);
    }
    return [...list].sort((a, b) => {
      let av = a[sort.key] as string | number | null;
      let bv = b[sort.key] as string | number | null;
      av ??= "";
      bv ??= "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [users, search, statusFilter, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1" style={{ minWidth: 220 }}>
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Buscar por email, nombre o ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border-border focus:ring-primary/40 w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border-border rounded-lg border px-3 py-2 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="blocked">Bloqueado</option>
          <option value="suspended">Suspendido</option>
          <option value="limited">Limitado</option>
        </select>
        <a
          href="/api/admin/export?type=users"
          download
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
        >
          <Download className="size-4" />
          CSV
        </a>
      </div>

      <p className="text-muted-foreground text-xs">
        {filtered.length} de {users.length} usuarios
      </p>

      {/* Tabla */}
      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground border-b">
              <tr>
                <Th k="email" sort={sort} onSort={toggleSort}>
                  Usuario
                </Th>
                <th className="px-4 py-2 text-left text-xs font-medium">
                  Estado
                </th>
                <Th k="createdAt" sort={sort} onSort={toggleSort}>
                  Registro
                </Th>
                <Th k="lastLoginAt" sort={sort} onSort={toggleSort}>
                  Último acceso
                </Th>
                <Th k="totalRuns" sort={sort} onSort={toggleSort} className="text-right">
                  Runs
                </Th>
                <Th k="totalCost" sort={sort} onSort={toggleSort} className="text-right">
                  Coste
                </Th>
                <Th k="lastActivity" sort={sort} onSort={toggleSort}>
                  Actividad
                </Th>
                <th className="px-4 py-2 text-xs font-medium">Modelos</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-muted-foreground px-4 py-8 text-center text-sm"
                  >
                    No hay usuarios que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-t transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.displayName}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {u.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {fmt(u.createdAt)}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {fmt(u.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {u.totalRuns}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                      ${u.totalCost.toFixed(4)}
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {fmt(u.lastActivity)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.modelsUsed.slice(0, 2).map((m) => (
                          <span
                            key={m}
                            className="bg-secondary text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]"
                          >
                            {m.split("/").pop()}
                          </span>
                        ))}
                        {u.modelsUsed.length > 2 && (
                          <span className="text-muted-foreground text-[10px]">
                            +{u.modelsUsed.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/users/${u.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
