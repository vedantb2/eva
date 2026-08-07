"use client";

import type { KeyboardEvent, PointerEvent } from "react";
import {
  SIDEBAR_MAX_WIDTH_PX,
  SIDEBAR_MIN_WIDTH_PX,
} from "@/lib/contexts/SidebarContext";
import { cn } from "@eva/ui";

interface SidebarResizeHandleProps {
  width: number;
  /** Live drag — may rubberband past min/max. */
  onWidthPreview: (width: number) => void;
  /** Pointer-up — clamp and persist. */
  onWidthCommit: (width: number) => void;
  /** Keyboard nudge — clamp immediately. */
  onWidthChange: (width: number) => void;
  className?: string;
}

/**
 * Drag handle on the secondary sidebar’s right edge (repo nav + sessions list).
 * Keyboard: ArrowLeft/ArrowRight nudge by 8px within min/max.
 * Drag: 1:1 with rubberband past bounds; commit clamps on release.
 */
export function SidebarResizeHandle({
  width,
  onWidthPreview,
  onWidthCommit,
  onWidthChange,
  className,
}: SidebarResizeHandleProps) {
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const handle = event.currentTarget;
    const startX = event.clientX;
    const startWidth = width;
    handle.setPointerCapture(event.pointerId);

    const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
      onWidthPreview(startWidth + (moveEvent.clientX - startX));
    };

    const onPointerUp = (upEvent: globalThis.PointerEvent) => {
      const raw = startWidth + (upEvent.clientX - startX);
      onWidthCommit(raw);
      handle.releasePointerCapture(upEvent.pointerId);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      handle.removeEventListener("pointercancel", onPointerUp);
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
    handle.addEventListener("pointercancel", onPointerUp);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onWidthChange(width - 8);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onWidthChange(width + 8);
    }
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={SIDEBAR_MIN_WIDTH_PX}
      aria-valuemax={SIDEBAR_MAX_WIDTH_PX}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={cn(
        "absolute inset-y-0 right-0 z-20 hidden w-1.5 cursor-col-resize touch-none lg:block",
        "after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-transparent",
        "hover:after:bg-border focus-visible:after:bg-ring focus-visible:outline-hidden",
        className,
      )}
    />
  );
}
