"use client";

import { Button, cn } from "@eva/ui";
import { IconArrowUp, IconLoader2 } from "@tabler/icons-react";
import { CrossfadeIcon } from "@/lib/components/ui/CrossfadeIcon";

interface CommentSendButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSubmitting: boolean;
  size?: "icon-xs" | "icon-sm";
  className?: string;
  ariaLabel?: string;
}

/**
 * Round send button shared by the comment composers. The arrow cross-fades to a
 * spinner while a submit is in flight so the action always has feedback.
 */
export function CommentSendButton({
  onClick,
  disabled,
  isSubmitting,
  size = "icon-xs",
  className,
  ariaLabel = "Send",
}: CommentSendButtonProps) {
  return (
    <Button
      type="button"
      size={size}
      className={cn("rounded-full", className)}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <CrossfadeIcon
        show={isSubmitting}
        trueKey="loading"
        falseKey="send"
        className="relative flex size-4 items-center justify-center"
        whenTrue={<IconLoader2 className="size-4 animate-spin" />}
        whenFalse={<IconArrowUp className="size-4" />}
      />
    </Button>
  );
}
