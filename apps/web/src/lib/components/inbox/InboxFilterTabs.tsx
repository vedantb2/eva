"use client";

import { Badge, cn } from "@eva/ui";
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
 * buttons, so the pair reads as a single choice.
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
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={cn(
              // Inactive keeps a transparent border so selecting does not shift layout.
              "flex items-center gap-1.5 rounded-control border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
              isActive
                ? "border-border bg-card font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {option.value === "unread" && unreadCount > 0 ? (
              <Badge className="h-4 min-w-4 justify-center rounded-full px-1 text-xs">
                {unreadCount}
              </Badge>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
