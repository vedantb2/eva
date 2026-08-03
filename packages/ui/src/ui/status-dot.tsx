import * as React from "react";

import { cn } from "../utils/cn";

export type StatusTone =
  | "progress"
  | "business-review"
  | "code-review"
  | "done"
  | "cancelled"
  | "neutral";

// Plain Record so Tailwind's static-class scanner can see every literal
// class here — a computed `bg-status-${tone}-bar` string would not survive
// the build's CSS purge.
const TONE_CLASS: Record<StatusTone, string> = {
  progress: "bg-status-progress-bar",
  "business-review": "bg-status-business-review-bar",
  "code-review": "bg-status-code-review-bar",
  done: "bg-status-done-bar",
  cancelled: "bg-status-cancelled-bar",
  neutral: "bg-muted-foreground/60",
};

const SIZE_CLASS: Record<"sm" | "md", string> = {
  sm: "size-1.5",
  md: "size-2",
};

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: StatusTone;
  /** Slightly larger dot for detail views. Default "sm". */
  size?: "sm" | "md";
}

/**
 * Linear-style status glyph: a small coloured dot that carries the status,
 * so the label next to it can stay neutral text instead of a coloured pill.
 */
export function StatusDot({
  tone,
  size = "sm",
  className,
  "aria-hidden": ariaHidden = true,
  ...props
}: StatusDotProps) {
  return (
    <span
      aria-hidden={ariaHidden}
      className={cn(
        "rounded-full shrink-0",
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    />
  );
}
