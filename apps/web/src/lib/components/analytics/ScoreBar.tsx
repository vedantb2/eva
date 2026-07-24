import { cn } from "@eva/ui";

const SEGMENTS = 32;

/**
 * Segmented tick-meter (the "score bar" from the reference dashboard).
 * Ticks fill left-to-right proportional to value/max. `tone` colours the
 * filled ticks: neutral by default, amber for a top performer, red for risk.
 */
export function ScoreBar({
  value,
  max,
  tone = "default",
}: {
  value: number;
  max: number;
  tone?: "default" | "top" | "risk";
}) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const filled = Math.round(ratio * SEGMENTS);
  const fillClass =
    tone === "top"
      ? "bg-warning"
      : tone === "risk"
        ? "bg-destructive"
        : "bg-foreground/65";

  return (
    <div className="flex w-full items-center gap-[2px]" aria-hidden>
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-3.5 flex-1 rounded-full",
            i < filled ? fillClass : "bg-muted-foreground/15",
          )}
        />
      ))}
    </div>
  );
}
