"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@conductor/ui";

/** Pixels per second the revealed text travels — constant speed so long labels don't whip by. */
const MARQUEE_SPEED_PX_PER_S = 60;
/** Clamp the scroll duration so very short / very long overflows both stay readable. */
const MIN_DURATION_S = 0.5;
const MAX_DURATION_S = 5;

interface MarqueeOnHoverProps {
  children: ReactNode;
  className?: string;
}

/**
 * Single-line label that scrolls its hidden tail into view on hover ("reveal and
 * hold") and shows a plain ellipsis the rest of the time. The motion only engages
 * when the text actually overflows its container.
 *
 * Two spans are required: the outer `mq-host` clips, the inner `mq-inner` holds the
 * text and is the element that translates. One element cannot both ellipsis-clip
 * itself and translate its own overflow into view — the clipping box and the moving
 * box must be different.
 *
 * Hover is driven entirely in CSS (see the `.mq-*` rules in globals.css); this
 * component only measures the overflow once per layout change and writes it to CSS
 * custom properties, so hovering never triggers a React re-render. Text styles
 * (font, colour, weight) are passed via `className` on the host and inherited by the
 * inner span — only the truncate / line-clamp token must be dropped by the caller.
 */
export function MarqueeOnHover({ children, className }: MarqueeOnHoverProps) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  // Re-measure after every content change, and whenever the host is resized or the
  // webfont swaps in — both change how much (if at all) the text overflows.
  useEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;

    let cancelled = false;
    let raf = 0;
    const recompute = () => {
      if (cancelled) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const shift = Math.max(0, inner.scrollWidth - host.clientWidth);
        const overflows = shift > 1; // 1px guard against sub-pixel rounding jitter
        host.dataset.mqOverflow = overflows ? "true" : "false";
        // Native tooltip is the touch / long-hover fallback — only when truncated.
        host.title = overflows ? (inner.textContent ?? "") : "";
        if (overflows) {
          const duration = Math.min(
            MAX_DURATION_S,
            Math.max(MIN_DURATION_S, shift / MARQUEE_SPEED_PX_PER_S),
          );
          host.style.setProperty("--mq-shift", `${shift}px`);
          host.style.setProperty("--mq-dur", `${duration}s`);
        }
      });
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(host);
    void document.fonts.ready.then(() => recompute());

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [children]);

  return (
    <span ref={hostRef} className={cn("mq-host", className)}>
      <span ref={innerRef} className="mq-inner">
        {children}
      </span>
    </span>
  );
}
