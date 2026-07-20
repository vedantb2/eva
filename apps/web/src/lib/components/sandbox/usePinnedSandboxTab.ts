"use client";

import { useCallback, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

/**
 * Optional sandbox tab opened from `+`: stays pinned until closed, and
 * deep-links / resume onto the tab pin it open.
 */
export function usePinnedSandboxTab(
  storageKey: string,
  tab: string,
  activeTab: string,
  onTabChange: (tab: string) => void,
) {
  const [isOpen, setIsOpen] = useLocalStorage(storageKey, false);

  useEffect(() => {
    if (activeTab === tab) {
      setIsOpen(true);
    }
  }, [activeTab, setIsOpen, tab]);

  const openTab = useCallback(() => {
    setIsOpen(true);
    onTabChange(tab);
  }, [onTabChange, setIsOpen, tab]);

  const closeTab = useCallback(() => {
    setIsOpen(false);
    if (activeTab === tab) {
      onTabChange("preview");
    }
  }, [activeTab, onTabChange, setIsOpen, tab]);

  return { isOpen, openTab, closeTab };
}
