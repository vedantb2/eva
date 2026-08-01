import { useState } from "react";
import { usePinnedSandboxTab } from "@/lib/components/sandbox/usePinnedSandboxTab";

/**
 * Tracks whether the optional Computer tab (from `+`) is pinned open, and
 * whether the shared desktop service is running so close can be gated.
 */
export function useComputerTab(
  storageScope: string,
  activeTab: string,
  onTabChange: (tab: string) => void,
) {
  const { isOpen, openTab, closeTab } = usePinnedSandboxTab(
    `eva:${storageScope}:computer-tab`,
    "computer",
    activeTab,
    onTabChange,
  );
  const [computerRunning, setComputerRunning] = useState(false);

  const closeComputer = () => {
    if (computerRunning) return;
    closeTab();
  };

  return {
    computerTabOpen: isOpen,
    computerRunning,
    setComputerRunning,
    openComputer: openTab,
    closeComputer,
  };
}
