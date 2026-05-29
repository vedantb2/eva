"use client";

import { useMemo } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";

type SandboxTab = "preview" | "desktop" | "editor" | "terminal" | "prd";

/** Tab order matches `SandboxTabBar` visual order (preview → computer → editor → terminal). */
const SANDBOX_TAB_BAR_ORDER: SandboxTab[] = [
  "preview",
  "desktop",
  "editor",
  "terminal",
];

export function getCyclableSandboxTabs(
  enabledTabs?: ReadonlyArray<SandboxTab>,
  showPrdTab?: boolean,
): SandboxTab[] {
  const tabs = enabledTabs
    ? SANDBOX_TAB_BAR_ORDER.filter((tab) => enabledTabs.includes(tab))
    : [...SANDBOX_TAB_BAR_ORDER];
  if (showPrdTab) {
    return [...tabs, "prd"];
  }
  return tabs;
}

/** Cycles sandbox tabs (Preview, Computer, …) with Shift+Tab. */
export function useCycleSandboxTabHotkey({
  activeTab,
  onTabChange,
  enabledTabs,
  showPrdTab,
  enabled = true,
}: {
  activeTab: SandboxTab;
  onTabChange: (tab: SandboxTab) => void;
  enabledTabs?: ReadonlyArray<SandboxTab>;
  showPrdTab?: boolean;
  enabled?: boolean;
}) {
  const cyclableTabs = useMemo(
    () => getCyclableSandboxTabs(enabledTabs, showPrdTab),
    [enabledTabs, showPrdTab],
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
