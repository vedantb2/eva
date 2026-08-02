"use client";

import { DropdownMenuItem } from "@eva/ui";
import { IconLink } from "@tabler/icons-react";

/** Copies the current page URL — shared More-menu item for task / project / session headers. */
export function CopyLinkMenuItem({ iconSize = 14 }: { iconSize?: number }) {
  return (
    <DropdownMenuItem
      onClick={() => {
        void navigator.clipboard.writeText(window.location.href);
      }}
    >
      <IconLink size={iconSize} />
      Copy link
    </DropdownMenuItem>
  );
}
