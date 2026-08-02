"use client";

import { Input, cn } from "@eva/ui";
import { IconSearch, IconX } from "@tabler/icons-react";

// "compact" is the small toolbar field; "large" is the taller, wider
// rounded-and-shadowed bar used on the quick-tasks / projects pages.
type ToggleSearchVariant = "compact" | "large";

interface ToggleSearchProps {
  value: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  visible?: boolean;
  variant?: ToggleSearchVariant;
}

export function ToggleSearch({
  value,
  onChange,
  placeholder = "Search...",
  visible = true,
  variant = "compact",
}: ToggleSearchProps) {
  const isLarge = variant === "large";

  if (!visible) return null;

  return (
    <div
      className={cn(
        "relative",
        isLarge ? "w-56 sm:w-64 md:w-80" : "w-28 sm:w-32 md:w-44",
      )}
    >
      <IconSearch
        size={isLarge ? 16 : 14}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value || null)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onChange(null);
          }
        }}
        className={cn(
          isLarge
            ? "h-9 rounded-control pl-9 pr-8 text-sm shadow-sm focus-visible:border-border focus-visible:shadow-md focus-visible:ring-0"
            : "h-8 pl-7 pr-7 text-sm focus-visible:border-border focus-visible:shadow-lg focus-visible:ring-0",
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
            isLarge ? "right-3" : "right-2",
          )}
        >
          <IconX size={isLarge ? 15 : 13} />
        </button>
      ) : null}
    </div>
  );
}
