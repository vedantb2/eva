import { IconWorld } from "@tabler/icons-react";
import { PaneTabStrip, type PaneTab } from "./PaneTabStrip";

interface PreviewPaneTabsProps {
  previewIds: string[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

function paneLabel(index: number) {
  return index === 0 ? "Preview" : `Preview ${index + 1}`;
}

export function PreviewPaneTabs({
  previewIds,
  activeId,
  onSelect,
  onClose,
}: PreviewPaneTabsProps) {
  // A single preview needs no strip — and the first pane is never closable.
  if (previewIds.length <= 1) {
    return null;
  }

  const tabs: PaneTab[] = previewIds.map((id, index) => ({
    id,
    label: paneLabel(index),
    closable: index > 0,
  }));

  return (
    <PaneTabStrip
      tabs={tabs}
      activeId={activeId}
      icon={IconWorld}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}
