import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { STATUS_LABELS, type ContentStatus } from "@/lib/library/types";

// Mapea cada estado a su color de marca y su icono (línea, Lucide).
const STYLES: Record<
  ContentStatus,
  { className: string; Icon: typeof Clock; spin?: boolean }
> = {
  pending: { className: "text-muted-foreground bg-muted", Icon: Clock },
  processing: {
    className: "text-brand-violet bg-brand-violet/10",
    Icon: Loader2,
    spin: true,
  },
  completed: {
    className: "text-brand-accent bg-brand-accent/10",
    Icon: CheckCircle2,
  },
  failed: { className: "text-destructive bg-destructive/10", Icon: XCircle },
  needs_review: {
    className: "text-brand-amber bg-brand-amber/10",
    Icon: AlertTriangle,
  },
  synced: { className: "text-brand-accent bg-brand-accent/10", Icon: RefreshCw },
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  const { className, Icon, spin } = STYLES[status] ?? STYLES.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className={`size-3 ${spin ? "animate-spin" : ""}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
