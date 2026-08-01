"use client";

import { IconPlus } from "@tabler/icons-react";
import { Button, cn } from "@eva/ui";
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
  className?: string;
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
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.22, ease: STAGGER_EASE },
    },
  };

  return (
    <m.div
      className={cn(
        "mx-auto flex w-full max-w-xl flex-col items-center justify-center px-4 text-center",
        className,
      )}
      variants={shouldAnimate ? containerVariants : undefined}
      initial={shouldAnimate ? "hidden" : false}
      animate={shouldAnimate ? "show" : undefined}
    >
      {icon ? (
        <m.div
          variants={shouldAnimate ? itemVariants : undefined}
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary"
        >
          {icon}
        </m.div>
      ) : null}
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
            <IconPlus className="size-4" />
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
