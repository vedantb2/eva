import {
  IconDeviceDesktop,
  IconCode,
  IconWorld,
  IconPlus,
  IconTerminal2,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@eva/ui";
import type { TerminalPanelApi } from "@/lib/components/sandbox/SandboxWorkspace";

export const SANDBOX_RAIL_ICON_BUTTON_CLASS =
  "motion-press max-sm:hit-target flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40";

export function SandboxTabBarTools({
  showEditorItem,
  showDesktopItem,
  onOpenEditor,
  onOpenComputer,
  onNewPreview,
  newPreviewDisabled,
  onTabChange,
  terminalPanel,
}: {
  showEditorItem: boolean;
  showDesktopItem: boolean;
  onOpenEditor: (() => void) | undefined;
  onOpenComputer: (() => void) | undefined;
  onNewPreview: () => void;
  newPreviewDisabled: boolean;
  onTabChange: (tab: string) => void;
  terminalPanel: TerminalPanelApi;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 md:mt-auto md:flex-col">
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={SANDBOX_RAIL_ICON_BUTTON_CLASS}
                aria-label="Open tab menu"
              >
                <IconPlus className="size-4" />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            Open tab menu
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="min-w-40">
          {showEditorItem ? (
            <DropdownMenuItem
              onClick={() => {
                if (onOpenEditor) {
                  onOpenEditor();
                  return;
                }
                onTabChange("editor");
              }}
            >
              <IconCode size={14} />
              Editor
            </DropdownMenuItem>
          ) : null}
          {showDesktopItem ? (
            <DropdownMenuItem
              onClick={() => {
                if (onOpenComputer) {
                  onOpenComputer();
                  return;
                }
                onTabChange("computer");
              }}
            >
              <IconDeviceDesktop size={14} />
              Computer
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onClick={onNewPreview}
            disabled={newPreviewDisabled}
          >
            <IconWorld size={14} />
            New Preview
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Toggle terminal panel"
            aria-pressed={terminalPanel.expanded}
            className={SANDBOX_RAIL_ICON_BUTTON_CLASS}
            onClick={terminalPanel.toggle}
          >
            <IconTerminal2 className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          Toggle terminal panel
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
