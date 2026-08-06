"use client";

import { Button } from "@eva/ui";
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import { CrossfadeIcon } from "@/lib/components/ui/CrossfadeIcon";

/** Show/hide the right sandbox panel (same control sessions use). */
export const SANDBOX_PANEL_TOGGLE_HOTKEY = "Ctrl+Alt+B";

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
  return (
    <Button
      size="icon-sm"
      variant="secondary"
      className="motion-press hover:scale-[1.01] active:scale-[0.96]"
      onClick={onToggle}
      title={
        collapsed
          ? `${expandLabel} (${SANDBOX_PANEL_TOGGLE_HOTKEY})`
          : `${collapseLabel} (${SANDBOX_PANEL_TOGGLE_HOTKEY})`
      }
      aria-label={
        collapsed
          ? `${expandLabel} (${SANDBOX_PANEL_TOGGLE_HOTKEY})`
          : `${collapseLabel} (${SANDBOX_PANEL_TOGGLE_HOTKEY})`
      }
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
