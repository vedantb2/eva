"use client";

import { AnimatePresence, motion } from "motion/react";

const ICON_MOTION = {
  initial: { scale: 0.25, opacity: 0, filter: "blur(4px)" },
  animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
  exit: { scale: 0.25, opacity: 0, filter: "blur(4px)" },
  transition: { type: "spring", duration: 0.3, bounce: 0 },
} as const;

interface CrossfadeIconProps {
  show: boolean;
  whenTrue: React.ReactNode;
  whenFalse: React.ReactNode;
  trueKey?: string;
  falseKey?: string;
  className?: string;
}

/** Cross-fades between two icons (scale, opacity, blur) per interface-feel guidelines. */
export function CrossfadeIcon({
  show,
  whenTrue,
  whenFalse,
  trueKey = "on",
  falseKey = "off",
  className = "relative flex size-5 items-center justify-center",
}: CrossfadeIconProps) {
  return (
    <span className={className}>
      <AnimatePresence initial={false}>
        {show ? (
          <motion.span
            key={trueKey}
            className="absolute inset-0 flex items-center justify-center"
            {...ICON_MOTION}
          >
            {whenTrue}
          </motion.span>
        ) : (
          <motion.span
            key={falseKey}
            className="absolute inset-0 flex items-center justify-center"
            {...ICON_MOTION}
          >
            {whenFalse}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
