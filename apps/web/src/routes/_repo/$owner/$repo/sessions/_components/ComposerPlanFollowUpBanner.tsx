"use client";

import { cn } from "@eva/ui";

/** Slim "Plan ready" strip — empty send implements, typed send stays in Plan. */
export function ComposerPlanFollowUpBanner({
  planTitle,
  className,
}: {
  planTitle: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-2 flex flex-wrap items-center gap-2 rounded-surface border border-border bg-muted/30 px-3 py-2.5",
        className,
      )}
    >
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        Plan ready
      </span>
      {planTitle ? (
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {planTitle}
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          Send to refine, or send empty to implement
        </span>
      )}
    </div>
  );
}
