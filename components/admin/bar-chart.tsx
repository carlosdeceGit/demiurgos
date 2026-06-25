interface BarChartProps {
  items: { label: string; value: number; sub?: string }[];
  maxValue?: number;
  color?: "primary" | "violet" | "amber";
  formatValue?: (v: number) => string;
}

const COLOR_CLASS = {
  primary: "bg-primary",
  violet: "bg-brand-violet",
  amber: "bg-brand-amber",
};

export function BarChart({
  items,
  maxValue,
  color = "primary",
  formatValue,
}: BarChartProps) {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 0.001);
  const fmt = formatValue ?? ((v: number) => String(v));

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-sm">
            <span className="truncate font-mono text-xs">{item.label}</span>
            <span className="text-muted-foreground ml-2 shrink-0 text-xs">
              {fmt(item.value)}
              {item.sub && (
                <span className="text-muted-foreground/60 ml-1">{item.sub}</span>
              )}
            </span>
          </div>
          <div className="bg-secondary mt-1 h-1.5 overflow-hidden rounded-full">
            <div
              className={["h-full rounded-full transition-all", COLOR_CLASS[color]].join(" ")}
              style={{ width: `${Math.max((item.value / max) * 100, 1)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
