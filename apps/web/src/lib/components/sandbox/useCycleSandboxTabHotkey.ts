"use client";

import { useMemo } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";
import type { SandboxTab } from "@/lib/search-params";

/**
 * Tab order matches `SandboxTabBar`'s visible tab row (preview → browser →
 * editor → terminal → diffs → optional PRD → custom tabs). Desktop is
 * excluded — it lives in the `+` menu.
 */
const SANDBOX_TAB_BAR_ORDER: SandboxTab[] = [
  "preview",
  "browser",
  "editor",
  "terminal",
  "diffs",
];

/**
 * Returns the Shift+Tab cycle order: enabled builtins, then the File Viewer and
 * PRD if shown, then custom tab slugs in display order.
 */
export function getCyclableSandboxTabs(
  enabledTabs?: ReadonlyArray<SandboxTab>,
  showPrdTab?: boolean,
  customTabSlugs?: ReadonlyArray<string>,
  showFilesTab?: boolean,
): string[] {
  const tabs = enabledTabs
    ? SANDBOX_TAB_BAR_ORDER.filter((tab) => enabledTabs.includes(tab))
    : [...SANDBOX_TAB_BAR_ORDER];
  const withFiles = showFilesTab ? [...tabs, "files"] : tabs;
  const withPrd = showPrdTab ? [...withFiles, "prd"] : withFiles;
  if (!customTabSlugs || customTabSlugs.length === 0) return withPrd;
  return [...withPrd, ...customTabSlugs];
}

/** Cycles sandbox tabs (Preview, Editor, …, custom) with Shift+Tab. */
export function useCycleSandboxTabHotkey({
  activeTab,
  onTabChange,
  enabledTabs,
  showPrdTab,
  showFilesTab,
  customTabSlugs,
  enabled = true,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  enabledTabs?: ReadonlyArray<SandboxTab>;
  showPrdTab?: boolean;
  showFilesTab?: boolean;
  customTabSlugs?: ReadonlyArray<string>;
  enabled?: boolean;
}) {
  const cyclableTabs = useMemo(
    () =>
      getCyclableSandboxTabs(
        enabledTabs,
        showPrdTab,
        customTabSlugs,
        showFilesTab,
      ),
    [enabledTabs, showPrdTab, customTabSlugs, showFilesTab],
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
