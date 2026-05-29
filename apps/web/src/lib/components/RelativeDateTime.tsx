"use client";

import {
  formatExactDateTime,
  formatRelativeTime,
} from "@conductor/shared/dates";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@conductor/ui";

interface RelativeDateTimeProps {
  /** Unix ms timestamp. When omitted, renders `emptyLabel` without a tooltip. */
  at?: number;
  emptyLabel?: string;
  className?: string;
}

/** Relative time (e.g. "2 minutes ago") with exact datetime in a hover tooltip. */
export function RelativeDateTime({
  at,
  emptyLabel = "Queued",
  className,
}: RelativeDateTimeProps) {
  if (at === undefined) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        {emptyLabel}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "cursor-default text-muted-foreground tabular-nums",
            className,
          )}
        >
          {formatRelativeTime(at)}
        </span>
      </TooltipTrigger>
      <TooltipContent>{formatExactDateTime(at)}</TooltipContent>
    </Tooltip>
  );
}
