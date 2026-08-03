"use client";

import { Button } from "@eva/ui";
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
    <Button
      type="button"
      variant="ghost"
      onClick={onToggle}
      className="h-auto w-full justify-start gap-2 rounded-menu-item px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground [&_svg]:size-3.5"
    >
      <IconDots />
      {expanded
        ? "Show less"
        : hiddenCount > 0
          ? `Show more (${hiddenCount})`
          : "Show more"}
    </Button>
  );
}
