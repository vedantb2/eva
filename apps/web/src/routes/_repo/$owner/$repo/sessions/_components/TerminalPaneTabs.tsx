import { IconTerminal2 } from "@tabler/icons-react";
import { PaneTabStrip, type PaneTab } from "./PaneTabStrip";

interface TerminalPaneTabsProps {
  termIds: string[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

function paneLabel(index: number) {
  return `Terminal ${index + 1}`;
}

export function TerminalPaneTabs({
  termIds,
  activeId,
  onSelect,
  onClose,
}: TerminalPaneTabsProps) {
  // These are the user-created terminals only; every one is closable, and a
  // single terminal still needs its tab (and close button) shown.
  if (termIds.length === 0) {
    return null;
  }

  const tabs: PaneTab[] = termIds.map((id, index) => ({
    id,
    label: paneLabel(index),
    closable: true,
  }));

  return (
    <PaneTabStrip
      tabs={tabs}
      activeId={activeId}
      icon={IconTerminal2}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}
