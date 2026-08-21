"use client";

import {
  IconWorld,
  IconBrowser,
  IconDeviceDesktop,
  IconCode,
  IconGitPullRequest,
  IconPlus,
  IconTerminal2,
} from "@tabler/icons-react";
import type { Doc } from "@eva/backend";
import { useCycleSandboxTabHotkey } from "@/lib/components/sandbox/useCycleSandboxTabHotkey";
import { useSandboxViewHotkeys } from "@/lib/components/sandbox/useSandboxViewHotkeys";
import { slugifyAppTabName } from "@/lib/utils/appTabSlug";
import type { SandboxTab } from "@/lib/search-params";
import type { SandboxFileListApi } from "@/lib/components/sandbox/useSandboxFileList";
import type { ConsoleDockApi } from "@/lib/components/sandbox/useConsoleDock";
import type { TerminalPanelApi } from "@/lib/components/sandbox/SandboxWorkspace";
import { SandboxQuickOpenDialogs } from "@/lib/components/sandbox/SandboxQuickOpenDialogs";
import {
  buildSandboxPaletteCommands,
  type SandboxCommandTab,
} from "@/lib/components/sandbox/sandboxPaletteCommands";
import { SandboxStatusChip } from "@/lib/components/sandbox/SandboxStatusChip";
import type { SandboxStatus } from "@/lib/components/sandbox/sandboxStatusStyles";
import {
  isSimpleViewHiddenSandboxTab,
  useSimpleView,
} from "@/lib/hooks/useSimpleView";
import {
  Tabs,
  TabsList,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@eva/ui";
import {
  isCollapsibleSandboxTab,
  SandboxTabTrigger,
} from "./SandboxTabTrigger";
import { buildSandboxTabDescriptors } from "./sandboxTabDescriptors";

/* Chips on the canvas, not folder tabs. The old bar drew a hairline under
   itself and had the active trigger cover that 1px back with `-mb-px` +
   `border-b-card`, a seam that then had to be re-patched with padding once the
   list started scrolling its own overflow. The pane below is `bg-card` and the
   bar sits on `--background`, so the tone step already separates them and the
   hairline is redundant (see docs/eva-ui.md). */
const TAB_BAR_CLASS = "flex shrink-0 items-center gap-1 px-1.5 py-1";

/* `justify-start` matters: the primitive centres its list, and centred content
   that overflows spills past *both* edges while `scrollLeft` cannot go
   negative — the leading tabs become unreachable. Scrolling is ungated here
   because the primitive only scrolls `max-sm:`, which left the desktop strip
   clipping its trailing tabs with no way to reach them. */
const TAB_LIST_CLASS =
  "h-auto max-w-full justify-start gap-1 overflow-x-auto rounded-none border-0 bg-transparent p-0 shadow-none scrollbar-none max-sm:justify-start [&_.t-tabs-pill]:smooth-shadow-ring-xs";

const ICON_BUTTON_CLASS =
  "motion-press max-sm:hit-target flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40";

/**
 * Past this many tabs the inactive labels collapse to icon-only (label moves to
 * a tooltip). A session can show Preview, Browser, Review, Files, Plan, Designs,
 * Editor, Computer and any number of user-defined tabs at once, so the strip has
 * to compress rather than simply run off the edge. The active tab keeps its
 * label so the current pane is always named.
 */
const MAX_LABELLED_TABS = 6;

// Editor and Computer stay in the `+` menu until opened; then they pin as
// closable tabs. Browser is first-class (sessions) for watching agent Chrome.
const allTabs: ReadonlyArray<SandboxCommandTab> = [
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
  /** Sandbox run state, shown as a chip at the trailing edge. */
  sandboxStatus?: SandboxStatus;
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
  sandboxStatus,
  fileList,
  consoleDock,
  terminalPanel,
}: SandboxTabBarProps) {
  const simpleView = useSimpleView();
  const tabs = enabledTabs
    ? allTabs.filter((tab) => enabledTabs.includes(tab.value))
    : allTabs.filter((tab) => tab.value !== "browser");
  const showDesktopItem =
    !simpleView && (!enabledTabs || enabledTabs.includes("computer"));
  const showEditorItem =
    !simpleView && (!enabledTabs || enabledTabs.includes("editor"));
  const resolvedTab =
    simpleView && isSimpleViewHiddenSandboxTab(activeTab)
      ? "preview"
      : activeTab;
  const showComputerTab = showDesktopItem && computerTabOpen;
  const showEditorTab = showEditorItem && editorTabOpen;

  const showFiles = showFilesTab && !simpleView;
  const visibleCustomTabs = simpleView ? [] : (customTabs ?? []);
  const customTabSlugs = visibleCustomTabs.map((tab) =>
    slugifyAppTabName(tab.name),
  );

  const tabDescriptors = buildSandboxTabDescriptors({
    baseTabs: tabs,
    showBrowserActivity: isAgentBrowsingActive(agentBrowsingAt),
    showEditorTab,
    onCloseEditor,
    showComputerTab,
    computerRunning,
    onCloseComputer,
    showFilesTab: showFiles,
    showPrdTab,
    hasPrdContent,
    showDesignsTab,
    hasDesignsContent,
    customTabs: visibleCustomTabs,
  });
  const collapseLabels = tabDescriptors.length > MAX_LABELLED_TABS;

  useCycleSandboxTabHotkey({
    activeTab: resolvedTab,
    onTabChange,
    enabledTabs,
    showPrdTab,
    showDesignsTab,
    showFilesTab: showFiles,
    customTabSlugs,
    showComputerTab,
    showEditorTab,
    enabled: hotkeysEnabled,
  });

  useSandboxViewHotkeys({
    activeTab: resolvedTab,
    onTabChange,
    showBrowserTab: tabs.some((tab) => tab.value === "browser"),
    enabled: hotkeysEnabled,
  });

  const commands = buildSandboxPaletteCommands({
    activeTab: resolvedTab,
    tabs,
    showFilesTab: showFiles,
    showPrdTab,
    showDesignsTab,
    showEditorItem,
    showDesktopItem,
    customTabs: visibleCustomTabs,
    consoleDock,
    terminalPanel,
    onTabChange,
    onOpenEditor,
    onOpenComputer,
    onNewPreview,
    newPreviewDisabled,
    simpleView,
  });

  return (
    <>
      <div className={TAB_BAR_CLASS}>
        <Tabs
          className="min-w-0 flex-1"
          value={resolvedTab}
          onValueChange={onTabChange}
        >
          <TabsList className={TAB_LIST_CLASS}>
            {tabDescriptors.map((tab) => (
              <SandboxTabTrigger
                key={tab.value}
                tab={tab}
                labelHidden={
                  collapseLabels &&
                  tab.value !== resolvedTab &&
                  isCollapsibleSandboxTab(tab)
                }
              />
            ))}
          </TabsList>
        </Tabs>
        {/* Outside Tabs so the menu isn't part of Radix tab focus/value sync. */}
        {simpleView ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={ICON_BUTTON_CLASS}
                aria-label="Open tab menu"
              >
                <IconPlus className="size-4" />
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
        )}
        {simpleView ? null : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Toggle terminal panel"
                aria-pressed={terminalPanel.expanded}
                className={ICON_BUTTON_CLASS}
                onClick={terminalPanel.toggle}
              >
                <IconTerminal2 className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Toggle terminal panel
            </TooltipContent>
          </Tooltip>
        )}
        {sandboxStatus ? <SandboxStatusChip status={sandboxStatus} /> : null}
      </div>
      <SandboxQuickOpenDialogs
        fileList={fileList}
        commands={commands}
        onShowFiles={() => onTabChange("files")}
        hotkeysEnabled={hotkeysEnabled}
        filesEnabled={showFiles}
      />
    </>
  );
}
