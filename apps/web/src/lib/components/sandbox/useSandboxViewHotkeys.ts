"use client";

import { useRef } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";

/**
 * Session/sandbox view shortcuts:
 * - Mod+Shift+B → toggle Browser tab
 * - Mod+P → toggle Files tab
 *
 * (Mod+J for the Preview console lives in `ConsoleDock`.)
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

  useHotkey(
    "Mod+Shift+B",
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

  useHotkey(
    "Mod+P",
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
