"use client";

import { Button, cn } from "@eva/ui";
import type { InboxFilter } from "@/lib/search-params";

const OPTIONS: { value: InboxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

interface InboxFilterTabsProps {
  filter: InboxFilter;
  unreadCount: number;
  onChange: (filter: InboxFilter) => void;
}

/**
 * Segmented All / Unread switch. One bordered control instead of two loose
 * buttons, so the pair reads as a single choice. The unread count rides along as
 * plain muted digits rather than a filled pill — the tab it sits in is already
 * the thing being counted.
 */
export function InboxFilterTabs({
  filter,
  unreadCount,
  onChange,
}: InboxFilterTabsProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-control border border-border bg-muted p-0.5">
      {OPTIONS.map((option) => {
        const isActive = filter === option.value;
        return (
          <Button
            key={option.value}
            size="xs"
            variant="ghost"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={cn(
              // Inactive keeps a transparent border so selecting does not shift layout.
              "h-6 gap-1.5 border px-2 font-medium",
              isActive
                ? "border-border bg-card text-foreground hover:bg-card"
                : "border-transparent",
            )}
          >
            {option.label}
            {option.value === "unread" && unreadCount > 0 ? (
              <span className="tabular-nums text-muted-foreground">
                {unreadCount}
              </span>
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}
