import type { ReactNode } from "react";
import { cn } from "@eva/ui";

interface PropertyRowProps {
  /** Field name shown in the rail's left column. */
  label: string;
  /**
   * `"start"` for values that wrap onto several lines (the label chips), so the
   * field name stays pinned to the first line instead of centring on the block.
   */
  align?: "center" | "start";
  children: ReactNode;
}

/**
 * One label/value row of a detail properties rail: a fixed-width muted field
 * name on the left, the control on the right. The rail used to be three
 * titled sections of bare full-width selects, which meant the reader had to
 * infer what each control was from whatever it happened to be showing.
 */
export function PropertyRow({
  label,
  align = "center",
  children,
}: PropertyRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2",
        align === "start" ? "items-start pt-1.5" : "items-center",
      )}
    >
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
