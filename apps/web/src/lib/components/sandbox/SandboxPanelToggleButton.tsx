"use client";

import { Button, CrossfadeIcon } from "@eva/ui";
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import { formatForDisplay } from "@tanstack/react-hotkeys";
import { useShortcutBinding } from "@/lib/hotkeys/ShortcutsContext";

/** Show/hide the right sandbox panel (same control sessions use). */
export function SandboxPanelToggleButton({
  collapsed,
  onToggle,
  expandLabel = "Show sandbox panel",
  collapseLabel = "Hide sandbox panel",
}: {
  collapsed: boolean;
  onToggle: () => void;
  expandLabel?: string;
  collapseLabel?: string;
}) {
  const hotkeyLabel = formatForDisplay(
    useShortcutBinding("toggleSandboxPanel"),
  );
  const label = collapsed
    ? `${expandLabel} (${hotkeyLabel})`
    : `${collapseLabel} (${hotkeyLabel})`;

  return (
    <Button
      size="icon-sm"
      variant="secondary"
      className="motion-press hover:scale-[1.01] active:scale-[0.96]"
      onClick={onToggle}
      title={label}
      aria-label={label}
    >
      <CrossfadeIcon
        show={collapsed}
        variant="soft"
        trueKey="expand"
        falseKey="collapse"
        className="relative flex size-3.5 items-center justify-center"
        whenTrue={<IconLayoutSidebarRightExpand className="size-3.5" />}
        whenFalse={<IconLayoutSidebarRightCollapse className="size-3.5" />}
      />
    </Button>
  );
}
