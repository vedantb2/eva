import { IconX } from "@tabler/icons-react";

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
        <button
          key={f.key}
          onClick={() => onClearFilter(f.key)}
          className="group flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
        >
          {f.label}
          <IconX
            size={12}
            className="opacity-50 group-hover:opacity-100 transition-opacity"
          />
        </button>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
