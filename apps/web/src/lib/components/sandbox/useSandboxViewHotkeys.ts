"use client";

import { useRef } from "react";
import { useShortcut } from "@/lib/hotkeys/ShortcutsContext";

/**
 * Session/sandbox view shortcut for toggling the Browser tab.
 *
 * File quick-open and the action palette live in `SandboxQuickOpenDialogs`;
 * the terminal-panel shortcut (`togglePreviewConsole`) lives in
 * `SandboxWorkspace`.
 */
export function useSandboxViewHotkeys({
  activeTab,
  onTabChange,
  showBrowserTab,
  enabled = true,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showBrowserTab: boolean;
  enabled?: boolean;
}) {
  const tabBeforeBrowserRef = useRef("preview");

  useShortcut(
    "toggleBrowserTab",
    (e) => {
      e.preventDefault();
      if (activeTab === "browser") {
        onTabChange(tabBeforeBrowserRef.current);
        return;
      }
      tabBeforeBrowserRef.current = activeTab;
      onTabChange("browser");
    },
    { enabled: enabled && showBrowserTab },
  );
}
