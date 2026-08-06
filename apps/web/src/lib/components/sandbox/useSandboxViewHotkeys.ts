"use client";

import { useRef } from "react";
import { useShortcut } from "@/lib/hotkeys/ShortcutsContext";

/**
 * Session/sandbox view shortcuts: `toggleBrowserTab` and `toggleFilesTab`.
 *
 * (`togglePreviewConsole` lives in `ConsoleDock`.)
 */
export function useSandboxViewHotkeys({
  activeTab,
  onTabChange,
  showBrowserTab,
  showFilesTab,
  enabled = true,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  showBrowserTab: boolean;
  showFilesTab: boolean;
  enabled?: boolean;
}) {
  const tabBeforeBrowserRef = useRef("preview");
  const tabBeforeFilesRef = useRef("preview");

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

  useShortcut(
    "toggleFilesTab",
    (e) => {
      e.preventDefault();
      if (activeTab === "files") {
        onTabChange(tabBeforeFilesRef.current);
        return;
      }
      tabBeforeFilesRef.current = activeTab;
      onTabChange("files");
    },
    { enabled: enabled && showFilesTab },
  );
}
