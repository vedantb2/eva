"use client";

import { IconPlus } from "@tabler/icons-react";
import { m, useReducedMotion, type Variants } from "motion/react";
import { Button } from "./button";
import { cn } from "../utils/cn";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  /**
   * Quiet stagger entrance for rare/first-time empties.
   * Pass `false` for filter "no results" flashes (tens/day).
   */
  animate?: boolean;
  className?: string;
}

const STAGGER_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * The quiet "nothing here" state: a small muted icon, one line of text, at
 * most one action. No illustration, no border/shadow of its own — it sits
 * directly on whatever surface it is dropped into.
 */
function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  animate = true,
  className,
}: EmptyStateProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && !reduceMotion;

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.04 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 6 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: STAGGER_EASE },
    },
  };

  return (
    <m.div
      className={cn(
        "mx-auto flex w-full max-w-xl flex-col items-center justify-center px-4 py-12 text-center",
        className,
      )}
      variants={shouldAnimate ? containerVariants : undefined}
      initial={shouldAnimate ? "hidden" : false}
      animate={shouldAnimate ? "show" : undefined}
    >
      {icon ? (
        <m.div
          variants={shouldAnimate ? itemVariants : undefined}
          className="mb-3 flex size-6 items-center justify-center text-muted-foreground"
        >
          {icon}
        </m.div>
      ) : null}
      <m.p
        variants={shouldAnimate ? itemVariants : undefined}
        className="text-balance text-2sm text-muted-foreground"
      >
        {title}
      </m.p>
      {description ? (
        <m.p
          variants={shouldAnimate ? itemVariants : undefined}
          className="mt-1 max-w-sm text-pretty text-xs text-muted-foreground"
        >
          {description}
        </m.p>
      ) : null}
      {actionLabel && onAction ? (
        <m.div variants={shouldAnimate ? itemVariants : undefined}>
          <Button size="sm" variant="secondary" onClick={onAction} className="mt-4">
            <IconPlus size={14} />
            {actionLabel}
          </Button>
        </m.div>
      ) : null}
      {action ? (
        <m.div
          variants={shouldAnimate ? itemVariants : undefined}
          className="mt-4"
        >
          {action}
        </m.div>
      ) : null}
    </m.div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
