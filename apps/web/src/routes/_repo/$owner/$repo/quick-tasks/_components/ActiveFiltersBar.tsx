import type { ReactNode } from "react";
import { IconX } from "@tabler/icons-react";

interface ActiveFiltersBarProps {
  filters: Array<{ key: string; label: ReactNode }>;
  onClearFilter: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFiltersBar({
  filters,
  onClearFilter,
  onClearAll,
}: ActiveFiltersBarProps) {
  return (
    // Chips are 20px tall on a pointer device, which is not a tap target. They
    // grow to the 40px floor below `sm` rather than taking `hit-target`:
    // a chip's neighbour is 6px away, so the 8px ::after bleed on each of them
    // would overlap and one chip would clear the other's filter.
    <div className="flex flex-wrap items-center gap-1.5 pb-2">
      <span className="text-xs text-muted-foreground mr-0.5">Filtered by</span>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onClearFilter(f.key)}
          className="group flex min-h-10 max-w-full items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors sm:min-h-0"
        >
          <span className="sr-only">Remove filter</span>
          <span className="truncate">{f.label}</span>
          <IconX
            size={12}
            aria-hidden="true"
            className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
          />
        </button>
      ))}
      {filters.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="ml-1 flex min-h-10 items-center text-xs text-muted-foreground hover:text-foreground transition-colors sm:min-h-0"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
