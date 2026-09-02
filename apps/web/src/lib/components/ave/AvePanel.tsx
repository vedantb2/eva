"use client";

import { lazy, Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { m } from "motion/react";
import { IconArrowsDiagonal, IconMinus } from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
  motionSpring,
} from "@eva/ui";
import { AveMark } from "@/lib/components/ave/AveMark";
import { PANEL_POSITION_STYLE } from "@/lib/components/ave/useAveLauncherPosition";

const AvePanelBody = lazy(() =>
  import("@/lib/components/ave/AvePanelBody").then((m) => ({
    default: m.AvePanelBody,
  })),
);

const HEADER_BUTTON_CLASS =
  "motion-press flex size-7 items-center justify-center rounded-md text-muted-foreground active:scale-[0.9] hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40";

/**
 * Manager Ave's chat as a floating popover, anchored above the launcher button
 * — including after the launcher has been dragged, since both read the same
 * position custom properties. Its size lives in `PANEL_POSITION_STYLE` because
 * the clamp that keeps it on screen has to be written in terms of it.
 *
 * Stays mounted once opened — `visible` only drives opacity/scale and a trailing
 * `visibility: hidden`, never an unmount — so minimizing keeps the conversation,
 * the composer draft and the scroll position exactly where they were.
 *
 * The height is a hard clamp, not a `max-h`: the chat virtualizer measures
 * against its nearest sized ancestor, and an unclamped one makes its measure
 * loop diverge and grow the surface by hundreds of px per second.
 *
 * The chrome is eager so the first click can play this spring immediately. The
 * session tree stays lazy — it is what used to delay the whole surface.
 */
export function AvePanel({
  visible,
  onMinimize,
}: {
  visible: boolean;
  onMinimize: () => void;
}) {
  return (
    <m.div
      role="dialog"
      aria-label="Manager Ave"
      aria-hidden={!visible}
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={
        visible
          ? { opacity: 1, scale: 1, y: 0, visibility: "visible" }
          : {
              opacity: 0,
              scale: 0.96,
              y: 8,
              transitionEnd: { visibility: "hidden" },
            }
      }
      transition={motionSpring}
      style={PANEL_POSITION_STYLE}
      className={cn(
        "fixed z-50",
        "flex flex-col overflow-hidden",
        "origin-bottom-right rounded-surface bg-popover/95 text-popover-foreground backdrop-blur-md smooth-shadow-ring-xl",
        visible ? null : "pointer-events-none",
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <AveMark size={20} className="shrink-0" />
        <span className="flex-1 truncate text-sm font-semibold">
          Manager Ave
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/ave"
              onClick={onMinimize}
              aria-label="Open Manager Ave full screen"
              className={HEADER_BUTTON_CLASS}
            >
              <IconArrowsDiagonal size={16} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">Open full screen</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onMinimize}
              aria-label="Minimize Manager Ave"
              className={HEADER_BUTTON_CLASS}
            >
              <IconMinus size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Minimize</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Suspense
          fallback={
            <div
              className="flex min-h-0 flex-1"
              aria-busy="true"
              aria-label="Opening Manager Ave"
            />
          }
        >
          <AvePanelBody />
        </Suspense>
      </div>
    </m.div>
  );
}
