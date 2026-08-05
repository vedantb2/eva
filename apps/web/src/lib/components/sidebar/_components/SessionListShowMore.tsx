"use client";

import { IconDots } from "@tabler/icons-react";

interface SessionListShowMoreProps {
  expanded: boolean;
  hiddenCount: number;
  onToggle: () => void;
}

/** Inline expand/collapse control for overflow non-archived sessions (t3code-style). */
export function SessionListShowMore({
  expanded,
  hiddenCount,
  onToggle,
}: SessionListShowMoreProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-menu-item px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
    >
      <IconDots size={14} />
      {expanded
        ? "Show less"
        : hiddenCount > 0
          ? `Show more (${hiddenCount})`
          : "Show more"}
    </button>
  );
}
