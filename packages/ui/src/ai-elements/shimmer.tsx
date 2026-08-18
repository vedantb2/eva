"use client";

import type { CSSProperties, ElementType } from "react";

import { cn } from "../utils/cn";

/** Inline style plus the `--spread` CSS custom property the shimmer gradient reads. */
interface ShimmerStyle extends CSSProperties {
  "--spread": string;
}

export interface TextShimmerProps {
  children: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

/**
 * Sweeps a highlight across the text.
 *
 * The sweep is a CSS animation rather than a motion/react one for two reasons.
 * It rendered `motion.create(element)` — a `motion` component, not an `m` one —
 * which *throws* under the app-wide `<LazyMotion strict>` in MotionProvider, so
 * every mount tripped an error boundary (simple-view streaming status was the
 * live path). And its rAF loop wrote `background-position` inline every frame:
 * ~211ms of main-thread time per 6s traced, against ~134ms for the same
 * keyframes in CSS with no script at all.
 *
 * `background-position` is a paint property, so this still repaints per frame.
 * That is inherent to a background-clipped text sweep — moving it on the
 * compositor instead would need the glyphs as a mask, which CSS cannot express
 * without duplicating the text into SVG. The win here is removing the script
 * and the crash, not the paint.
 *
 * Keyframes: `shimmer-sweep` in the host app's globals.css, alongside the
 * `shimmer-text` keyframes that <LoadingState/>'s label already relies on.
 */
export function Shimmer({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const shimmerStyle: ShimmerStyle = {
    "--spread": `${(children?.length ?? 0) * spread}px`,
    backgroundImage:
      "var(--bg), linear-gradient(rgb(var(--muted-foreground)), rgb(var(--muted-foreground)))",
    // Inline rather than a Tailwind arbitrary animation: the duration is a prop,
    // and `animate-[…var(--x)…]` would need a second custom property to carry it.
    animation: `shimmer-sweep ${duration}s linear infinite`,
  };

  return (
    <Component
      className={cn(
        "relative inline-block bg-size-[250%_100%,auto] bg-clip-text text-transparent",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),rgb(var(--background)),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        className,
      )}
      style={shimmerStyle}
    >
      {children}
    </Component>
  );
}
