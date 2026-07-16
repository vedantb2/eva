"use client";

import {
  IconWorld,
  IconDeviceDesktop,
  IconCode,
  IconTerminal2,
  IconClipboardList,
  IconGitCompare,
  IconPlus,
} from "@tabler/icons-react";
import type { Doc } from "@conductor/backend";
import { useCycleSandboxTabHotkey } from "@/lib/components/sandbox/useCycleSandboxTabHotkey";
import { isSessionSandboxTab } from "@/lib/search-params";
import { slugifyAppTabName } from "@/lib/utils/appTabSlug";
import { resolveTablerIcon } from "@/lib/utils/tablerIcon";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@conductor/ui";

type SandboxTab =
  | "preview"
  | "desktop"
  | "editor"
  | "terminal"
  | "diffs"
  | "prd";

const TAB_TRIGGER_CLASS =
  "relative flex items-center gap-1.5 rounded-none rounded-t-md border border-b-0 px-4 py-1.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:border-border data-[state=active]:z-10 data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-secondary";

// Desktop ("Computer") is intentionally absent — it lives in the `+` menu, not
// the tab row, since it is rarely used.
const allTabs: Array<{
  value: SandboxTab;
  label: string;
  icon: typeof IconWorld;
}> = [
  { value: "preview", label: "Preview", icon: IconWorld },
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
  /** Subset of base tabs to render. Defaults to all four. */
  enabledTabs?: ReadonlyArray<SandboxTab>;
  /** User-defined tabs for this app; expected pre-filtered to enabled ones. */
  customTabs?: ReadonlyArray<Doc<"appTabs">>;
}

export function SandboxTabBar({
  activeTab,
  onTabChange,
  onNewPreview,
  onNewTerminal,
  newPreviewDisabled = false,
  newTerminalDisabled = false,
  showPrdTab = false,
  enabledTabs,
  customTabs,
}: SandboxTabBarProps) {
  const tabs = enabledTabs
    ? allTabs.filter((tab) => enabledTabs.includes(tab.value))
    : allTabs;
  // Desktop is offered from the `+` menu wherever it would otherwise be enabled.
  const showDesktopItem = !enabledTabs || enabledTabs.includes("desktop");

  // The hotkey cycles builtins only; when a custom tab is active, treat it as
  // preview so Shift+Tab re-enters the builtin cycle.
  useCycleSandboxTabHotkey({
    activeTab: isSessionSandboxTab(activeTab) ? activeTab : "preview",
    onTabChange,
    enabledTabs,
    showPrdTab,
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
              </TabsTrigger>
            );
          })}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 flex h-[30px] w-8 shrink-0 items-center justify-center rounded-t-md text-muted-foreground transition-[transform,background-color] hover:bg-secondary hover:text-foreground active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40"
                aria-label="Open tab menu"
              >
                <IconPlus className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[10rem]">
              {showDesktopItem ? (
                <DropdownMenuItem onClick={() => onTabChange("desktop")}>
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
        </TabsList>
      </Tabs>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </div>
  );
}
