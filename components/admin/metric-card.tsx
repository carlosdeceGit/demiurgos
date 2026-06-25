interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function MetricCard({ label, value, sub, accent }: MetricCardProps) {
  return (
    <div
      className={[
        "rounded-xl border p-4",
        accent
          ? "border-brand-accent-tint-border bg-brand-accent-tint"
          : "bg-card",
      ].join(" ")}
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={[
          "mt-1 text-2xl font-semibold tabular-nums",
          accent ? "text-brand-accent" : "",
        ].join(" ")}
      >
        {value}
      </p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
    </div>
  );
}
