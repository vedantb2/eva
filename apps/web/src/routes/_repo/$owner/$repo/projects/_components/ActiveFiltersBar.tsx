import { IconX } from "@tabler/icons-react";
import { Button } from "@eva/ui";

interface ActiveFiltersBarProps {
  filters: Array<{ key: string; label: string }>;
  onClearFilter: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFiltersBar({
  filters,
  onClearFilter,
  onClearAll,
}: ActiveFiltersBarProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap pb-2">
      <span className="text-xs text-muted-foreground mr-0.5">Filtered by</span>
      {filters.map((f) => (
        <Button
          key={f.key}
          variant="ghost"
          onClick={() => onClearFilter(f.key)}
          className="group h-auto gap-1 rounded-control bg-muted/60 px-2 py-0.5 text-xs font-normal hover:bg-muted"
        >
          {f.label}
          <IconX
            size={12}
            className="opacity-50 group-hover:opacity-100 transition-opacity"
          />
        </Button>
      ))}
      {filters.length > 1 && (
        <Button
          variant="ghost"
          onClick={onClearAll}
          className="h-auto rounded-control px-0 text-xs font-normal hover:bg-transparent hover:text-foreground ml-1"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
