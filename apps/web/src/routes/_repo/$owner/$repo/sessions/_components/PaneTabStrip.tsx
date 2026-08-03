import type { ComponentType } from "react";
import { Button, cn } from "@eva/ui";
import { IconX } from "@tabler/icons-react";

export interface PaneTab {
  id: string;
  label: string;
  /** False for the first preview pane, which cannot be closed. */
  closable: boolean;
}

interface PaneTabStripProps {
  tabs: ReadonlyArray<PaneTab>;
  activeId: string;
  /** Leading glyph, the same for every tab in a strip (globe / terminal). */
  icon: ComponentType<{ className?: string }>;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

/**
 * Secondary tab strip for the several panes living inside one sandbox tab
 * (multiple previews, multiple terminals). Deliberately quieter than the
 * primary `SandboxTabBar`: it sits on the canvas tone with a hairline under
 * it rather than a muted wash, the faces are 28px, and selection is carried
 * by a surface fill — no border swap, no shadow, so nothing shifts.
 *
 * `PreviewPaneTabs` and `TerminalPaneTabs` are thin wrappers over this; they
 * differ only in their icon, their label wording, and the rule for when the
 * strip is worth rendering at all.
 */
export function PaneTabStrip({
  tabs,
  activeId,
  icon: Icon,
  onSelect,
  onClose,
}: PaneTabStripProps) {
  return (
    <div
      className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border px-2 py-1 scrollbar-thin"
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <div
            key={tab.id}
            className={cn(
              "group flex h-7 shrink-0 items-center rounded-control border border-transparent",
              selected ? "bg-card" : "hover:bg-muted/60",
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              // Plain toggle buttons, not ARIA tabs: a `tablist` role would
              // promise arrow-key navigation this strip does not implement.
              aria-pressed={selected}
              className={cn(
                "h-full min-w-24 justify-start gap-1.5 px-2 text-2sm font-medium hover:bg-transparent",
                selected ? "text-foreground" : "text-muted-foreground",
              )}
              onClick={() => onSelect(tab.id)}
            >
              <Icon className="size-3.5 shrink-0" />
              {tab.label}
            </Button>
            {tab.closable ? (
              <Button
                variant="ghost"
                size="icon-xs"
                className="mr-0.5 size-6 opacity-70 group-hover:opacity-100 focus-visible:opacity-100"
                aria-label={`Close ${tab.label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onClose(tab.id);
                }}
              >
                <IconX className="size-3.5" />
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
