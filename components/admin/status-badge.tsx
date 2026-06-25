const STATUS_STYLES: Record<string, string> = {
  active:
    "bg-brand-accent-tint text-brand-accent border border-brand-accent-tint-border",
  blocked: "bg-destructive/10 text-destructive border border-destructive/20",
  suspended: "bg-brand-amber/10 text-brand-amber border border-brand-amber/20",
  limited: "bg-secondary text-muted-foreground border border-border",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  blocked: "Bloqueado",
  suspended: "Suspendido",
  limited: "Limitado",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-secondary text-muted-foreground",
      ].join(" ")}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
