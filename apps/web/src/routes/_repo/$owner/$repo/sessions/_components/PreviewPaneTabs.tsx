import { IconWorld, IconX } from "@tabler/icons-react";
import { cn } from "@conductor/ui";

interface PreviewPaneTabsProps {
  previewIds: string[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

function paneLabel(index: number) {
  return index === 0 ? "Preview" : `Preview ${index + 1}`;
}

export function PreviewPaneTabs({
  previewIds,
  activeId,
  onSelect,
  onClose,
}: PreviewPaneTabsProps) {
  if (previewIds.length <= 1) {
    return null;
  }

  return (
    <div
      className="flex shrink-0 items-center gap-1 overflow-x-auto bg-muted/40 px-2 py-1.5 scrollbar-thin"
      role="tablist"
    >
      {previewIds.map((id, index) => {
        const selected = id === activeId;
        return (
          <div
            key={id}
            className={cn(
              "group flex h-8 shrink-0 items-center rounded-md transition-[transform,background-color]",
              selected ? "bg-card" : "hover:bg-muted/80",
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                "flex h-full min-w-24 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-[transform,background-color] active:scale-[0.96]",
                selected
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => onSelect(id)}
            >
              <IconWorld className="size-3.5 shrink-0" />
              {paneLabel(index)}
            </button>
            {index > 0 ? (
              <button
                type="button"
                className="mr-1 flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-70 transition-[transform,background-color,opacity] hover:bg-muted hover:text-foreground hover:opacity-100 active:scale-[0.96] group-hover:opacity-100"
                aria-label={`Close ${paneLabel(index)}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onClose(id);
                }}
              >
                <IconX className="size-3.5" />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
