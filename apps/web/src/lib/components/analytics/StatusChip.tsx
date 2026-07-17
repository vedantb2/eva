import type { ReactNode } from "react";
import { cn } from "@conductor/ui";
import { type Icon as TablerIcon } from "@tabler/icons-react";

type StatusTone = "top" | "positive" | "warning" | "risk" | "neutral";

const toneClass: Record<StatusTone, string> = {
  top: "bg-warning/15 text-warning",
  positive: "bg-success/15 text-success",
  warning: "bg-status-progress-subtle text-status-progress",
  risk: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

/**
 * Soft pastel status pill (the "Top" / "Check" / "Positive" chips from the
 * reference). Background + saturated text from the shared semantic tokens.
 */
export function StatusChip({
  tone,
  icon: Icon,
  children,
}: {
  tone: StatusTone;
  icon?: TablerIcon;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        toneClass[tone],
      )}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
