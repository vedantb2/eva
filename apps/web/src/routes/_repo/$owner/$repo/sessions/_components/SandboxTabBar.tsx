"use client";

import { useMemo } from "react";
import {
  IconWorld,
  IconBrowser,
  IconDeviceDesktop,
  IconCode,
  IconTerminal2,
  IconClipboardList,
  IconGitCompare,
  IconFileText,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import type { Doc } from "@conductor/backend";
import { useCycleSandboxTabHotkey } from "@/lib/components/sandbox/useCycleSandboxTabHotkey";
import { slugifyAppTabName } from "@/lib/utils/appTabSlug";
import { resolveTablerIcon } from "@/lib/utils/tablerIcon";
import type { SandboxTab } from "@/lib/search-params";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@conductor/ui";

const TAB_TRIGGER_CLASS =
  "relative flex items-center gap-1.5 rounded-none rounded-t-md border border-b-0 px-4 py-1.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:border-border data-[state=active]:z-10 data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-secondary";

// Desktop ("Computer") stays in the `+` menu until opened; then it pins as a
// closable tab. Browser is first-class (sessions) for watching agent Chrome.
const allTabs: Array<{
  value: SandboxTab;
  label: string;
  icon: typeof IconWorld;
}> = [
  { value: "preview", label: "Preview", icon: IconWorld },
  { value: "browser", label: "Browser", icon: IconBrowser },
  { value: "editor", label: "Editor", icon: IconCode },
  { value: "terminal", label: "Terminal", icon: IconTerminal2 },
  { value: "diffs", label: "Diffs", icon: IconGitCompare },
];

interface SandboxTabBarProps {
  /** Builtin tab id (SandboxTab) or a custom tab's name slug. */
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewPreview: () => void;
  onNewTerminal: () => void;
  newPreviewDisabled?: boolean;
  newTerminalDisabled?: boolean;
  showPrdTab?: boolean;
  /** Shows the File Viewer tab (sessions only). */
  showFilesTab?: boolean;
  /** Subset of base tabs to render. Defaults to all four. */
  enabledTabs?: ReadonlyArray<SandboxTab>;
  /** User-defined tabs for this app; expected pre-filtered to enabled ones. */
  customTabs?: ReadonlyArray<Doc<"appTabs">>;
  /** When set (and fresh), shows a pulse on the Browser tab. */
  agentBrowsingAt?: number;
  /** Computer tab pinned open from `+` (persists until closed). */
  computerTabOpen?: boolean;
  /** True while Computer is starting/running — close is disabled. */
  computerRunning?: boolean;
  onOpenComputer?: () => void;
  onCloseComputer?: () => void;
}

const AGENT_BROWSING_LOCK_TTL_MS = 30 * 60 * 1000;

function isAgentBrowsingActive(agentBrowsingAt: number | undefined): boolean {
  if (agentBrowsingAt === undefined) return false;
  return Date.now() - agentBrowsingAt < AGENT_BROWSING_LOCK_TTL_MS;
}

export function SandboxTabBar({
  activeTab,
  onTabChange,
  onNewPreview,
  onNewTerminal,
  newPreviewDisabled = false,
  newTerminalDisabled = false,
  showPrdTab = false,
  showFilesTab = false,
  enabledTabs,
  customTabs,
  agentBrowsingAt,
  computerTabOpen = false,
  computerRunning = false,
  onOpenComputer,
  onCloseComputer,
}: SandboxTabBarProps) {
  const tabs = enabledTabs
    ? allTabs.filter((tab) => enabledTabs.includes(tab.value))
    : allTabs.filter((tab) => tab.value !== "browser");
  // Desktop is offered from the `+` menu wherever it would otherwise be enabled.
  const showDesktopItem = !enabledTabs || enabledTabs.includes("computer");
  const showBrowserPulse = isAgentBrowsingActive(agentBrowsingAt);
  const showComputerTab = showDesktopItem && computerTabOpen;

  const customTabSlugs = useMemo(
    () => (customTabs ?? []).map((tab) => slugifyAppTabName(tab.name)),
    [customTabs],
  );

  useCycleSandboxTabHotkey({
    activeTab,
    onTabChange,
    enabledTabs,
    showPrdTab,
    showFilesTab,
    customTabSlugs,
    showComputerTab,
  });

  return (
    <div className="relative flex items-end gap-1 px-2 pt-1.5 bg-secondary/50">
      <Tabs
        className="min-w-0 flex-1"
        value={activeTab}
        onValueChange={onTabChange}
      >
        <TabsList className="h-auto gap-0 rounded-none border-0 bg-transparent p-0 shadow-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={TAB_TRIGGER_CLASS}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.value === "browser" && showBrowserPulse ? (
                  <span
                    className="ml-0.5 size-1.5 shrink-0 rounded-full bg-primary animate-pulse"
                    aria-label="Agent is browsing"
                  />
                ) : null}
              </TabsTrigger>
            );
          })}
          {showComputerTab ? (
            <TabsTrigger value="computer" className={TAB_TRIGGER_CLASS}>
              <IconDeviceDesktop className="w-3.5 h-3.5" />
              Computer
              {computerRunning ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-0.5 inline-flex">
                      <button
                        type="button"
                        disabled
                        aria-label="Stop Computer before closing this tab"
                        className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-40"
                      >
                        <IconX className="size-3.5" />
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Stop Computer before closing this tab
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  aria-label="Close Computer tab"
                  className="ml-0.5 flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCloseComputer?.();
                  }}
                  onPointerDown={(e) => {
                    // Keep Radix Tabs from selecting via the close hit-target.
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <IconX className="size-3.5" />
                </button>
              )}
            </TabsTrigger>
          ) : null}
          {showFilesTab ? (
            <TabsTrigger value="files" className={TAB_TRIGGER_CLASS}>
              <IconFileText className="w-3.5 h-3.5" />
              Files
            </TabsTrigger>
          ) : null}
          {showPrdTab ? (
            <TabsTrigger value="prd" className={TAB_TRIGGER_CLASS}>
              <IconClipboardList className="w-3.5 h-3.5" />
              PRD
            </TabsTrigger>
          ) : null}
          {customTabs?.map((tab) => {
            const Icon = resolveTablerIcon(tab.icon);
            const slug = slugifyAppTabName(tab.name);
            return (
              <TabsTrigger
                key={tab._id}
                value={slug}
                className={TAB_TRIGGER_CLASS}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.name}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      {/* Outside Tabs so the menu isn't part of Radix tab focus/value sync. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="mb-px flex h-[30px] w-8 shrink-0 items-center justify-center rounded-t-md text-muted-foreground transition-[transform,background-color] hover:bg-secondary hover:text-foreground active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40"
            aria-label="Open tab menu"
          >
            <IconPlus className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[10rem]">
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
          <DropdownMenuItem
            onClick={onNewTerminal}
            disabled={newTerminalDisabled}
          >
            <IconTerminal2 size={14} />
            New Terminal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </div>
  );
}
