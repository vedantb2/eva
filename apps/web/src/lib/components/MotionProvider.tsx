"use client";

import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Single app-wide Motion feature bundle. Consumers should import `m` from
 * `motion/react` (not `motion`) so the animation graph stays out of entry
 * chunks and loads lazily — see react-doctor/use-lazy-motion.
 *
 * `domMax` lives in `motionFeatures.ts` and is `import()`ed after first paint.
 * Importing it here would put layout animations back on the landing JS.
 * Uses `domMax` (not `domAnimation`) because the sidebar nav relies on shared
 * `layoutId` transitions (SharedLayoutNav); layout animations live only in the
 * `domMax` feature set. Under `strict`, a missing feature silently no-ops the
 * animation, so `domAnimation` here would kill the sliding nav highlight.
 *
 * Until the feature chunk arrives, `m.*` nodes render in their `animate`
 * state (or static styles). Do not put LCP text behind `initial="hidden"`.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={() => import("@/lib/motionFeatures")} strict>
      {children}
    </LazyMotion>
  );
}
