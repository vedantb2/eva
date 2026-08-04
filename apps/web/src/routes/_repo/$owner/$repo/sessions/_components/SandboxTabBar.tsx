"use client";

import {
  IconWorld,
  IconBrowser,
  IconDeviceDesktop,
  IconCode,
  IconTerminal2,
  IconClipboardList,
  IconGitPullRequest,
  IconFileText,
  IconPalette,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import type { Doc } from "@eva/backend";
import { useCycleSandboxTabHotkey } from "@/lib/components/sandbox/useCycleSandboxTabHotkey";
import { slugifyAppTabName } from "@/lib/utils/appTabSlug";
import { TablerIconByName } from "@/lib/components/TablerIconByName";
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
} from "@eva/ui";

/** Sandbox tabs: active face is fill + type only — no folder stroke or bar
 *  hairline, so the strip blends into the panel instead of reading as chrome. */
const TAB_TRIGGER_CLASS =
  "relative flex items-center gap-1.5 rounded-none rounded-t-md border border-transparent px-3 py-1 text-xs font-medium data-[state=active]:z-10 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground";

// Editor and Computer stay in the `+` menu until opened; then they pin as
// closable tabs. Browser is first-class (sessions) for watching agent Chrome.
const allTabs: Array<{
  value: SandboxTab;
  label: string;
  icon: typeof IconWorld;
}> = [
  { value: "preview", label: "Preview", icon: IconWorld },
  { value: "browser", label: "Browser", icon: IconBrowser },
  { value: "terminal", label: "Terminal", icon: IconTerminal2 },
  { value: "review", label: "Review", icon: IconGitPullRequest },
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
  /** When true, shows a content indicator on the Plan tab. */
  hasPrdContent?: boolean;
  showDesignsTab?: boolean;
  /** When true, shows a content indicator on the Designs tab. */
  hasDesignsContent?: boolean;
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
  /** Editor tab pinned open from `+` (persists until closed). */
  editorTabOpen?: boolean;
  onOpenEditor?: () => void;
  onCloseEditor?: () => void;
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
  hasPrdContent = false,
  showDesignsTab = false,
  hasDesignsContent = false,
  showFilesTab = false,
  enabledTabs,
  customTabs,
  agentBrowsingAt,
  computerTabOpen = false,
  computerRunning = false,
  onOpenComputer,
  onCloseComputer,
  editorTabOpen = false,
  onOpenEditor,
  onCloseEditor,
}: SandboxTabBarProps) {
  const tabs = enabledTabs
    ? allTabs.filter((tab) => enabledTabs.includes(tab.value))
    : allTabs.filter((tab) => tab.value !== "browser");
  const showDesktopItem = !enabledTabs || enabledTabs.includes("computer");
  const showEditorItem = !enabledTabs || enabledTabs.includes("editor");
  const showBrowserPulse = isAgentBrowsingActive(agentBrowsingAt);
  const showComputerTab = showDesktopItem && computerTabOpen;
  const showEditorTab = showEditorItem && editorTabOpen;

  const customTabSlugs = (customTabs ?? []).map((tab) =>
    slugifyAppTabName(tab.name),
  );

  useCycleSandboxTabHotkey({
    activeTab,
    onTabChange,
    enabledTabs,
    showPrdTab,
    showDesignsTab,
    showFilesTab,
    customTabSlugs,
    showComputerTab,
    showEditorTab,
  });

  return (
    <div className="relative flex items-end gap-1 px-2 pt-1.5">
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
                    className="ml-0.5 size-1.5 shrink-0 rounded-full bg-primary"
                    aria-label="Agent is browsing"
                  />
                ) : null}
              </TabsTrigger>
            );
          })}
          {showEditorTab ? (
            <TabsTrigger value="editor" className={TAB_TRIGGER_CLASS}>
              <IconCode className="w-3.5 h-3.5" />
              Editor
              <button
                type="button"
                aria-label="Close Editor tab"
                className="ml-0.5 flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCloseEditor?.();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <IconX className="size-3.5" />
              </button>
            </TabsTrigger>
          ) : null}
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
              Plan
              {hasPrdContent ? (
                <span
                  className="ml-0.5 size-1.5 shrink-0 rounded-full bg-primary"
                  aria-label="Plan available"
                />
              ) : null}
            </TabsTrigger>
          ) : null}
          {showDesignsTab ? (
            <TabsTrigger value="designs" className={TAB_TRIGGER_CLASS}>
              <IconPalette className="w-3.5 h-3.5" />
              Designs
              {hasDesignsContent ? (
                <span
                  className="ml-0.5 size-1.5 shrink-0 rounded-full bg-primary"
                  aria-label="Design variations available"
                />
              ) : null}
            </TabsTrigger>
          ) : null}
          {customTabs?.map((tab) => {
            const slug = slugifyAppTabName(tab.name);
            return (
              <TabsTrigger
                key={tab._id}
                value={slug}
                className={TAB_TRIGGER_CLASS}
              >
                <TablerIconByName name={tab.icon} className="w-3.5 h-3.5" />
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
          <DropdownMenuItem
            onClick={onNewTerminal}
            disabled={newTerminalDisabled}
          >
            <IconTerminal2 size={14} />
            New Terminal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
