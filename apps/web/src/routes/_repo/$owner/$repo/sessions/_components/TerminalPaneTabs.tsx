import { IconX } from "@tabler/icons-react";
import { cn } from "@conductor/ui";

interface TerminalPaneTabsProps {
  termIds: string[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

function paneLabel(index: number) {
  return index === 0 ? "Terminal" : `Terminal ${index + 1}`;
}

export function TerminalPaneTabs({
  termIds,
  activeId,
  onSelect,
  onClose,
}: TerminalPaneTabsProps) {
  if (termIds.length <= 1) {
    return null;
  }

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 bg-muted/40 px-2 py-1"
      role="tablist"
    >
      {termIds.map((id, index) => {
        const selected = id === activeId;
        return (
          <div key={id} className="flex items-center">
            <button
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-[transform,background-color]",
                selected
                  ? "bg-card text-foreground"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
              onClick={() => onSelect(id)}
            >
              {paneLabel(index)}
            </button>
            {index > 0 ? (
              <button
                type="button"
                className="ml-0.5 rounded p-0.5 text-muted-foreground transition-[transform,background-color] hover:bg-muted hover:text-foreground"
                aria-label={`Close ${paneLabel(index)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(id);
                }}
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
