import type { ReactNode } from "react";
import { cn } from "@eva/ui";
import { type Icon as TablerIcon } from "@tabler/icons-react";

type StatusTone = "top" | "positive" | "warning" | "risk" | "neutral";

// Plain Records (not a computed template string) so Tailwind's static-class
// scanner can see every literal class here — see StatusDot for the same note.
const GLYPH_TEXT_CLASS: Record<StatusTone, string> = {
  top: "text-warning",
  positive: "text-success",
  warning: "text-status-progress-bar",
  risk: "text-destructive",
  neutral: "text-muted-foreground",
};

const GLYPH_DOT_CLASS: Record<StatusTone, string> = {
  top: "bg-warning",
  positive: "bg-success",
  warning: "bg-status-progress-bar",
  risk: "bg-destructive",
  neutral: "bg-muted-foreground",
};

/**
 * Quiet status glyph: a tone-coloured icon (or a small tone-coloured dot when
 * no icon is given) next to neutral text — never a filled pastel pill, so
 * status does not compete visually with the content around it.
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
    <span className="inline-flex items-center gap-1 text-2xs font-medium text-muted-foreground">
      {Icon ? (
        <Icon size={12} className={GLYPH_TEXT_CLASS[tone]} />
      ) : (
        <span
          aria-hidden
          className={cn("size-1.5 shrink-0 rounded-full", GLYPH_DOT_CLASS[tone])}
        />
      )}
      {children}
    </span>
  );
}
