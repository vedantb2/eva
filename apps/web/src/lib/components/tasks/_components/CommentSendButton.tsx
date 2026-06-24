"use client";

import { AnimatePresence, motion } from "motion/react";
import { Button, cn } from "@conductor/ui";
import { IconArrowUp, IconLoader2 } from "@tabler/icons-react";

/** Contextual icon swap (scale/opacity/blur) per the interface-feel guidelines. */
const ICON_MOTION = {
  initial: { scale: 0.25, opacity: 0, filter: "blur(4px)" },
  animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
  exit: { scale: 0.25, opacity: 0, filter: "blur(4px)" },
  transition: { type: "spring", duration: 0.3, bounce: 0 },
} as const;

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
      {/* Both icons share one centered cell so they cross-fade in place. */}
      <span className="relative flex size-4 items-center justify-center">
        <AnimatePresence initial={false}>
          {isSubmitting ? (
            <motion.span
              key="loading"
              className="absolute inset-0 flex items-center justify-center"
              {...ICON_MOTION}
            >
              <IconLoader2 size={16} className="animate-spin" />
            </motion.span>
          ) : (
            <motion.span
              key="send"
              className="absolute inset-0 flex items-center justify-center"
              {...ICON_MOTION}
            >
              <IconArrowUp size={16} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </Button>
  );
}
