import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@eva/ui";

interface HorizontalScrollFadeProps {
  children: ReactNode;
  /** Wrapper around the scrollport (positioning context for the fade). */
  className?: string;
  /** Classes for the scrollable element itself. */
  contentClassName?: string;
}

/**
 * Horizontal scroller with soft edge fades while more columns remain off-screen.
 * Right fade while you can scroll further right; left fade once you've scrolled away
 * from the start. Both hide when content fits without overflow.
 */
export function HorizontalScrollFade({
  children,
  className,
  contentClassName,
}: HorizontalScrollFadeProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 1) {
        setShowLeftFade(false);
        setShowRightFade(false);
        return;
      }
      setShowLeftFade(el.scrollLeft > 1);
      setShowRightFade(el.scrollLeft < maxScroll - 1);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });

    const ro = new ResizeObserver(update);
    ro.observe(el);

    const observeChildren = () => {
      for (const child of el.children) {
        ro.observe(child);
      }
    };
    observeChildren();

    const mo = new MutationObserver(() => {
      observeChildren();
      update();
    });
    mo.observe(el, { childList: true });

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <div className={cn("relative min-w-0", className)}>
      <div ref={scrollRef} className={contentClassName}>
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-muted via-muted/40 to-transparent blur-[2px] transition-opacity duration-200",
          showLeftFade ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-muted via-muted/40 to-transparent blur-[2px] transition-opacity duration-200",
          showRightFade ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
