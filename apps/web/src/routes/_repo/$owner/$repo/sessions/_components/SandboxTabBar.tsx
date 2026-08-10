"use client";

import {
  IconWorld,
  IconBrowser,
  IconDeviceDesktop,
  IconCode,
  IconClipboardList,
  IconGitPullRequest,
  IconFileText,
  IconPalette,
  IconPlus,
  IconTerminal2,
  IconX,
} from "@tabler/icons-react";
import type { Doc } from "@eva/backend";
import { useCycleSandboxTabHotkey } from "@/lib/components/sandbox/useCycleSandboxTabHotkey";
import { useSandboxViewHotkeys } from "@/lib/components/sandbox/useSandboxViewHotkeys";
import { slugifyAppTabName } from "@/lib/utils/appTabSlug";
import { TablerIconByName } from "@/lib/components/TablerIconByName";
import type { SandboxTab } from "@/lib/search-params";
import type { SandboxFileListApi } from "@/lib/components/sandbox/useSandboxFileList";
import type { ConsoleDockApi } from "@/lib/components/sandbox/useConsoleDock";
import type { TerminalPanelApi } from "@/lib/components/sandbox/SandboxWorkspace";
import { SandboxQuickOpenDialogs } from "@/lib/components/sandbox/SandboxQuickOpenDialogs";
import { buildSandboxPaletteCommands } from "@/lib/components/sandbox/sandboxPaletteCommands";
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

export type SandboxTabBarSize = "default" | "compact";

const TAB_TRIGGER_BASE =
  "relative flex items-center rounded-none rounded-t-md border border-b-0 font-medium data-[state=active]:-mb-px data-[state=active]:border-b data-[state=active]:border-b-card data-[state=active]:bg-card data-[state=active]:border-border data-[state=active]:z-10 data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-secondary";

const TAB_BAR_BASE =
  "relative flex items-end gap-1 border-b border-border px-2";

const TAB_CLOSE_BUTTON_BASE =
  "ml-0.5 flex shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

const TAB_ADD_BUTTON_BASE =
  "flex shrink-0 items-center justify-center rounded-t-md text-muted-foreground transition-[transform,background-color] hover:bg-secondary hover:text-foreground active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40";

function getSandboxTabBarStyles(size: SandboxTabBarSize) {
  if (size === "compact") {
    return {
      bar: `${TAB_BAR_BASE} mt-1 px-1.5 pt-0.5`,
      trigger: `${TAB_TRIGGER_BASE} gap-1 px-2.5 py-1 text-xs`,
      icon: "size-3 shrink-0",
      closeButton: `${TAB_CLOSE_BUTTON_BASE} size-3.5`,
      closeIcon: "size-3",
      addButton: `${TAB_ADD_BUTTON_BASE} mb-px h-6 w-6`,
      addIcon: "size-3",
      pulseDot: "ml-0.5 size-1 shrink-0 rounded-full bg-primary",
    };
  }
  return {
    bar: `${TAB_BAR_BASE} pt-1.5`,
    trigger: `${TAB_TRIGGER_BASE} gap-1.5 px-4 py-1.5 text-sm`,
    icon: "size-3.5 shrink-0",
    closeButton: `${TAB_CLOSE_BUTTON_BASE} size-5`,
    closeIcon: "size-3.5",
    addButton: `${TAB_ADD_BUTTON_BASE} mb-px h-[30px] w-8`,
    addIcon: "size-4",
    pulseDot: "ml-0.5 size-1.5 shrink-0 rounded-full bg-primary",
  };
}

// Editor and Computer stay in the `+` menu until opened; then they pin as
// closable tabs. Browser is first-class (sessions) for watching agent Chrome.
const allTabs: Array<{
  value: SandboxTab;
  label: string;
  icon: typeof IconWorld;
}> = [
  { value: "preview", label: "Preview", icon: IconWorld },
  { value: "browser", label: "Browser", icon: IconBrowser },
  { value: "review", label: "Review", icon: IconGitPullRequest },
];

interface SandboxTabBarProps {
  /** Builtin tab id (SandboxTab) or a custom tab's name slug. */
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewPreview: () => void;
  newPreviewDisabled?: boolean;
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
  /** When false, view hotkeys are inert (inactive cached session shells). */
  hotkeysEnabled?: boolean;
  /** Tab row density — `compact` for a shorter bar with smaller labels/icons. */
  tabSize?: SandboxTabBarSize;
  /** Shorthand for `tabSize="compact"`. */
  compact?: boolean;
  fileList: SandboxFileListApi;
  consoleDock: ConsoleDockApi;
  terminalPanel: TerminalPanelApi;
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
  newPreviewDisabled = false,
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
  hotkeysEnabled = true,
  tabSize = "default",
  compact = false,
  fileList,
  consoleDock,
  terminalPanel,
}: SandboxTabBarProps) {
  const styles = getSandboxTabBarStyles(compact ? "compact" : tabSize);
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
    enabled: hotkeysEnabled,
  });

  useSandboxViewHotkeys({
    activeTab,
    onTabChange,
    showBrowserTab: tabs.some((tab) => tab.value === "browser"),
    enabled: hotkeysEnabled,
  });

  const commands = buildSandboxPaletteCommands({
    activeTab,
    tabs,
    showFilesTab,
    showPrdTab,
    showDesignsTab,
    showEditorItem,
    showDesktopItem,
    customTabs: customTabs ?? [],
    consoleDock,
    terminalPanel,
    onTabChange,
    onOpenEditor,
    onOpenComputer,
    onNewPreview,
    newPreviewDisabled,
  });

  return (
    <>
      <div className={styles.bar}>
      <Tabs
        className="min-w-0 flex-1"
        value={activeTab}
        onValueChange={onTabChange}
      >
        <TabsList className="h-auto gap-0 rounded-none border-0 bg-transparent p-0 shadow-none [&_.t-tabs-pill]:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={styles.trigger}
              >
                <Icon className={styles.icon} />
                {tab.label}
                {tab.value === "browser" && showBrowserPulse ? (
                  <span
                    className={styles.pulseDot}
                    aria-label="Agent is browsing"
                  />
                ) : null}
              </TabsTrigger>
            );
          })}
          {showEditorTab ? (
            <TabsTrigger value="editor" className={styles.trigger}>
              <IconCode className={styles.icon} />
              Editor
              <button
                type="button"
                aria-label="Close Editor tab"
                className={styles.closeButton}
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
                <IconX className={styles.closeIcon} />
              </button>
            </TabsTrigger>
          ) : null}
          {showComputerTab ? (
            <TabsTrigger value="computer" className={styles.trigger}>
              <IconDeviceDesktop className={styles.icon} />
              Computer
              {computerRunning ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-0.5 inline-flex">
                      <button
                        type="button"
                        disabled
                        aria-label="Stop Computer before closing this tab"
                        className={`${styles.closeButton} opacity-40`}
                      >
                        <IconX className={styles.closeIcon} />
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
                  className={styles.closeButton}
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
                  <IconX className={styles.closeIcon} />
                </button>
              )}
            </TabsTrigger>
          ) : null}
          {showFilesTab ? (
            <TabsTrigger value="files" className={styles.trigger}>
              <IconFileText className={styles.icon} />
              Files
            </TabsTrigger>
          ) : null}
          {showPrdTab ? (
            <TabsTrigger value="prd" className={styles.trigger}>
              <IconClipboardList className={styles.icon} />
              Plan
              {hasPrdContent ? (
                <span className={styles.pulseDot} aria-label="Plan available" />
              ) : null}
            </TabsTrigger>
          ) : null}
          {showDesignsTab ? (
            <TabsTrigger value="designs" className={styles.trigger}>
              <IconPalette className={styles.icon} />
              Designs
              {hasDesignsContent ? (
                <span
                  className={styles.pulseDot}
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
                className={styles.trigger}
              >
                <TablerIconByName name={tab.icon} className={styles.icon} />
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
            className={styles.addButton}
            aria-label="Open tab menu"
          >
            <IconPlus className={styles.addIcon} />
          </button>
        </DropdownMenuTrigger>
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
            className={`${styles.addButton} hit-target`}
            onClick={terminalPanel.toggle}
          >
            <IconTerminal2 className={styles.addIcon} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Toggle terminal panel
        </TooltipContent>
      </Tooltip>
      </div>
      <SandboxQuickOpenDialogs
        fileList={fileList}
        commands={commands}
        onShowFiles={() => onTabChange("files")}
        hotkeysEnabled={hotkeysEnabled}
        filesEnabled={showFilesTab}
      />
    </>
  );
}
