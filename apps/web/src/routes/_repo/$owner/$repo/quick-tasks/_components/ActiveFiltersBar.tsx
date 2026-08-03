import type { ReactNode } from "react";
import { Button } from "@eva/ui";
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
    <div className="flex flex-wrap items-center gap-1.5 pb-2">
      <span className="mr-0.5 text-xs text-muted-foreground">Filtered by</span>
      {filters.map((f) => (
        <Button
          key={f.key}
          variant="ghost"
          size="xs"
          onClick={() => onClearFilter(f.key)}
          className="group gap-1 bg-muted/60 font-normal text-muted-foreground hover:bg-muted"
        >
          {f.label}
          <IconX
            size={12}
            className="opacity-50 transition-opacity group-hover:opacity-100"
          />
        </Button>
      ))}
      {filters.length > 1 && (
        <Button
          variant="ghost"
          size="xs"
          onClick={onClearAll}
          className="ml-1 px-1 font-normal text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
