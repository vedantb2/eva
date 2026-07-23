"use client";

import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Single app-wide Motion feature bundle. Consumers should import `m` from
 * `motion/react` (not `motion`) so the full animation graph stays out of
 * entry chunks — see react-doctor/use-lazy-motion.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
