"use client";

import { Button } from "@eva/ui";
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import { CrossfadeIcon } from "@/lib/components/ui/CrossfadeIcon";

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
  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-8 motion-press [@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.03] active:scale-[0.96]"
      onClick={onToggle}
      title={collapsed ? expandLabel : collapseLabel}
    >
      <CrossfadeIcon
        show={collapsed}
        variant="soft"
        trueKey="expand"
        falseKey="collapse"
        className="relative flex size-4 items-center justify-center"
        whenTrue={<IconLayoutSidebarRightExpand className="size-4" />}
        whenFalse={<IconLayoutSidebarRightCollapse className="size-4" />}
      />
    </Button>
  );
}
