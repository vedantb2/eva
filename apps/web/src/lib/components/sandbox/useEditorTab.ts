"use client";

import { usePinnedSandboxTab } from "@/lib/components/sandbox/usePinnedSandboxTab";

/** Optional Editor tab from `+` — same pin/close pattern as Computer. */
export function useEditorTab(
  storageScope: string,
  activeTab: string,
  onTabChange: (tab: string) => void,
) {
  const { isOpen, openTab, closeTab } = usePinnedSandboxTab(
    `conductor:${storageScope}:editor-tab`,
    "editor",
    activeTab,
    onTabChange,
  );

  return {
    editorTabOpen: isOpen,
    openEditor: openTab,
    closeEditor: closeTab,
  };
}
