import { useEffect } from "react";
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

  const openTab = () => {
    setIsOpen(true);
    onTabChange(tab);
  };

  const closeTab = () => {
    setIsOpen(false);
    if (activeTab === tab) {
      onTabChange("preview");
    }
  };

  return { isOpen, openTab, closeTab };
}
