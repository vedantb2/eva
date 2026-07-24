"use client";

import { IconPlus } from "@tabler/icons-react";
import { Button } from "@conductor/ui";
import { m, useReducedMotion, type Variants } from "motion/react";

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
}

const STAGGER_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  animate = true,
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
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.22, ease: STAGGER_EASE },
    },
  };

  return (
    <m.div
      className="ui-surface mx-auto flex w-full max-w-xl flex-col items-center justify-center border-dashed px-4 py-8 text-center sm:px-6 sm:py-14"
      variants={shouldAnimate ? containerVariants : undefined}
      initial={shouldAnimate ? "hidden" : false}
      animate={shouldAnimate ? "show" : undefined}
    >
      <m.div
        variants={shouldAnimate ? itemVariants : undefined}
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"
      >
        {icon}
      </m.div>
      <m.p
        variants={shouldAnimate ? itemVariants : undefined}
        className="text-balance text-base font-semibold tracking-[-0.01em] text-foreground"
      >
        {title}
      </m.p>
      {description ? (
        <m.p
          variants={shouldAnimate ? itemVariants : undefined}
          className="mt-2 max-w-sm text-pretty text-sm text-muted-foreground"
        >
          {description}
        </m.p>
      ) : null}
      {actionLabel && onAction ? (
        <m.div variants={shouldAnimate ? itemVariants : undefined}>
          <Button size="sm" onClick={onAction} className="mt-5">
            <IconPlus size={16} />
            {actionLabel}
          </Button>
        </m.div>
      ) : null}
      {action ? (
        <m.div variants={shouldAnimate ? itemVariants : undefined}>
          {action}
        </m.div>
      ) : null}
    </m.div>
  );
}
