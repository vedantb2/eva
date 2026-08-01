"use client";

import { LazyMotion, MotionConfig, domMax } from "motion/react";
import type { ReactNode } from "react";

/**
 * Single app-wide Motion feature bundle. Consumers should import `m` from
 * `motion/react` (not `motion`) so the animation graph stays out of entry
 * chunks and loads lazily — see react-doctor/use-lazy-motion.
 *
 * Uses `domMax` (not `domAnimation`) because the sidebar nav relies on shared
 * `layoutId` transitions (SharedLayoutNav); layout animations live only in the
 * `domMax` feature set. Under `strict`, a missing feature silently no-ops the
 * animation, so `domAnimation` here would kill the sliding nav highlight.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    // `reducedMotion="user"` is the app-wide honouring of the OS setting: Motion
    // drops transform/layout animation and keeps only opacity. The CSS-side
    // counterpart lives in the `prefers-reduced-motion` block in globals.css —
    // that one cannot reach JS-driven animation, and this one cannot reach CSS
    // keyframes, so both are needed.
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domMax} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
