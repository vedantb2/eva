"use client";

import { Button } from "@conductor/ui";
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";

/** Show/hide the right sandbox panel (same control sessions use). */
export function SandboxPanelToggleButton({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-8 motion-press hover:scale-[1.03] active:scale-[0.96]"
      onClick={onToggle}
      title={collapsed ? "Show sandbox panel" : "Hide sandbox panel"}
    >
      {collapsed ? (
        <IconLayoutSidebarRightExpand className="size-4" />
      ) : (
        <IconLayoutSidebarRightCollapse className="size-4" />
      )}
    </Button>
  );
}
