"use client";

import { Badge, Tabs, TabsList, TabsTrigger } from "@eva/ui";
import type { InboxFilter } from "@/lib/search-params";

const OPTIONS: { value: InboxFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

function isInboxFilter(value: string): value is InboxFilter {
  return value === "all" || value === "unread";
}

interface InboxFilterTabsProps {
  filter: InboxFilter;
  unreadCount: number;
  onChange: (filter: InboxFilter) => void;
}

/** Segmented All / Unread switch for the inbox. */
export function InboxFilterTabs({
  filter,
  unreadCount,
  onChange,
}: InboxFilterTabsProps) {
  return (
    <Tabs
      value={filter}
      onValueChange={(value) => {
        if (isInboxFilter(value)) onChange(value);
      }}
    >
      <TabsList className="tabs-segmented h-8">
        {OPTIONS.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className="gap-1.5 px-2.5 py-1 text-xs"
          >
            {option.label}
            {option.value === "unread" && unreadCount > 0 ? (
              <Badge className="h-4 min-w-4 justify-center rounded-full px-1 text-xs">
                {unreadCount}
              </Badge>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
