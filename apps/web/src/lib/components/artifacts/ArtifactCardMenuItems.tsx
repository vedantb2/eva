import { ContextMenuItem, DropdownMenuItem } from "@eva/ui";
import {
  IconExternalLink,
  IconLayoutDashboard,
  IconTrash,
} from "@tabler/icons-react";

/**
 * The artifact tile's actions, hosted in either menu surface. Right-click covers
 * pointer devices; below `sm` a kebab re-hosts the same items, since touch has
 * nothing to right-click and the tile carried no visible affordance at all.
 */
export interface ArtifactCardMenuItemsProps {
  variant: "context" | "dropdown";
  onOpen: () => void;
  onOpenInNewTab: () => void;
  onDelete: () => void;
}

export function ArtifactCardMenuItems({
  variant,
  onOpen,
  onOpenInNewTab,
  onDelete,
}: ArtifactCardMenuItemsProps) {
  const Item = variant === "context" ? ContextMenuItem : DropdownMenuItem;

  return (
    <>
      <Item onClick={onOpen}>
        <IconLayoutDashboard size={16} />
        Open
      </Item>
      <Item onClick={onOpenInNewTab}>
        <IconExternalLink size={16} />
        Open in new tab
      </Item>
      <Item className="text-destructive" onClick={onDelete}>
        <IconTrash size={16} />
        Delete
      </Item>
    </>
  );
}
