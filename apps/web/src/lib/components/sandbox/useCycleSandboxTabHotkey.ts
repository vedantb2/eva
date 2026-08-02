"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import type { SandboxTab } from "@/lib/search-params";

/**
 * Tab order matches `SandboxTabBar`'s always-visible row (preview → browser →
 * terminal → Review). Editor / Computer are only cyclable when pinned from `+`.
 */
const SANDBOX_TAB_BAR_ORDER: SandboxTab[] = [
  "preview",
  "browser",
  "terminal",
  "review",
];

/**
 * Returns the Shift+Tab cycle order: enabled builtins, then Editor/Computer
 * when open, then File Viewer / PRD if shown, then custom tab slugs.
 */
function getCyclableSandboxTabs(
  enabledTabs?: ReadonlyArray<SandboxTab>,
  showPrdTab?: boolean,
  showDesignsTab?: boolean,
  customTabSlugs?: ReadonlyArray<string>,
  showFilesTab?: boolean,
  showComputerTab?: boolean,
  showEditorTab?: boolean,
): string[] {
  const tabs = enabledTabs
    ? SANDBOX_TAB_BAR_ORDER.filter((tab) => enabledTabs.includes(tab))
    : [...SANDBOX_TAB_BAR_ORDER];
  const withEditor = showEditorTab ? [...tabs, "editor"] : tabs;
  const withComputer = showComputerTab
    ? [...withEditor, "computer"]
    : withEditor;
  const withFiles = showFilesTab ? [...withComputer, "files"] : withComputer;
  const withPrd = showPrdTab ? [...withFiles, "prd"] : withFiles;
  const withDesigns = showDesignsTab ? [...withPrd, "designs"] : withPrd;
  if (!customTabSlugs || customTabSlugs.length === 0) return withDesigns;
  return [...withDesigns, ...customTabSlugs];
}

/** Cycles sandbox tabs (Preview, Terminal, …, custom) with Shift+Tab. */
export function useCycleSandboxTabHotkey({
  activeTab,
  onTabChange,
  enabledTabs,
  showPrdTab,
  showDesignsTab,
  showFilesTab,
  customTabSlugs,
  showComputerTab,
  showEditorTab,
  enabled = true,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  enabledTabs?: ReadonlyArray<SandboxTab>;
  showPrdTab?: boolean;
  showDesignsTab?: boolean;
  showFilesTab?: boolean;
  customTabSlugs?: ReadonlyArray<string>;
  showComputerTab?: boolean;
  showEditorTab?: boolean;
  enabled?: boolean;
}) {
  const cyclableTabs = getCyclableSandboxTabs(
    enabledTabs,
    showPrdTab,
    showDesignsTab,
    customTabSlugs,
    showFilesTab,
    showComputerTab,
    showEditorTab,
  );

  useHotkey(
    "Shift+Tab",
    (e) => {
      if (cyclableTabs.length === 0) return;
      e.preventDefault();
      const currentIndex = cyclableTabs.indexOf(activeTab);
      const safeIndex = currentIndex === -1 ? 0 : currentIndex;
      const nextIndex = (safeIndex + 1) % cyclableTabs.length;
      onTabChange(cyclableTabs[nextIndex]);
    },
    { enabled: enabled && cyclableTabs.length > 1 },
  );
}
