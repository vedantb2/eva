"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

/**
 * Tracks whether the optional Computer tab (from `+`) is pinned open, and
 * whether the shared desktop service is running so close can be gated.
 */
export function useComputerTab(
  storageScope: string,
  activeTab: string,
  onTabChange: (tab: string) => void,
) {
  const [computerTabOpen, setComputerTabOpen] = useLocalStorage(
    `conductor:${storageScope}:computer-tab`,
    false,
  );
  const [computerRunning, setComputerRunning] = useState(false);

  // Deep-link / resume onto /computer pins the tab open.
  useEffect(() => {
    if (activeTab === "computer") {
      setComputerTabOpen(true);
    }
  }, [activeTab, setComputerTabOpen]);

  const openComputer = useCallback(() => {
    setComputerTabOpen(true);
    onTabChange("computer");
  }, [onTabChange, setComputerTabOpen]);

  const closeComputer = useCallback(() => {
    if (computerRunning) return;
    setComputerTabOpen(false);
    if (activeTab === "computer") {
      onTabChange("preview");
    }
  }, [activeTab, computerRunning, onTabChange, setComputerTabOpen]);

  return {
    computerTabOpen,
    computerRunning,
    setComputerRunning,
    openComputer,
    closeComputer,
  };
}
