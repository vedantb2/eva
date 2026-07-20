"use client";

import { Button } from "@conductor/ui";
import { IconLink } from "@tabler/icons-react";

/** Copies the current page URL. Shared across task / project / session headers. */
export function CopyLinkButton({
  size = "sm",
  iconSize = 16,
  className,
}: {
  size?: "sm" | "icon-sm";
  iconSize?: number;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      className={className}
      onClick={() => {
        void navigator.clipboard.writeText(window.location.href);
      }}
    >
      <IconLink size={iconSize} />
      <span className="hidden sm:inline">Copy link</span>
    </Button>
  );
}
