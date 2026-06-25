"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { cn } from "@conductor/ui";
import { assignHeadingIds, type TocItem } from "./_utils/tocUtils";

interface FloatingTocProps {
  // Scroll container holding the rendered headings. Doubles as the scroll root
  // for active-section tracking.
  containerRef: RefObject<HTMLElement | null>;
  // Re-scan headings whenever the document content changes.
  content: string;
  className?: string;
}

/** Offset from the top of the scroll container when picking / scrolling to a section. */
const SCROLL_SPY_OFFSET = 96;

function headingTopInContainer(
  el: HTMLElement,
  container: HTMLElement,
): number {
  return (
    el.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop
  );
}

/**
 * Scroll-spy "On this page" navigation for doc content.
 *
 * Scans the rendered DOM after paint, assigns stable ids, and builds the
 * section list from what is actually on screen. Highlights the section at the
 * viewport top while scrolling; clicking a section scrolls it into view.
 */
export function FloatingToc({
  containerRef,
  content,
  className,
}: FloatingTocProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [scrollActiveId, setScrollActiveId] = useState<string | null>(null);
  const [clickActiveId, setClickActiveId] = useState<string | null>(null);
  const clickScrollingRef = useRef(false);

  const activeId = clickActiveId ?? scrollActiveId ?? items[0]?.id ?? null;

  // Scan rendered headings whenever content changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scan = () => {
      const next = assignHeadingIds(container);
      setItems(next);
      if (next.length > 0) {
        setScrollActiveId((current) => current ?? next[0].id);
      }
    };

    const raf = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(raf);
  }, [containerRef, content]);

  // Highlight the last heading that has scrolled past the top of the viewport.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const updateFromScroll = () => {
      if (clickScrollingRef.current) return;

      const marker = container.scrollTop + SCROLL_SPY_OFFSET;
      let active = items[0]?.id ?? null;

      for (const item of items) {
        const el = container.querySelector<HTMLElement>(
          `#${CSS.escape(item.id)}`,
        );
        if (!el) continue;
        if (headingTopInContainer(el, container) <= marker) {
          active = item.id;
        }
      }

      setScrollActiveId(active);
    };

    updateFromScroll();
    container.addEventListener("scroll", updateFromScroll, { passive: true });
    const resizeObserver = new ResizeObserver(updateFromScroll);
    resizeObserver.observe(container);
    return () => {
      container.removeEventListener("scroll", updateFromScroll);
      resizeObserver.disconnect();
    };
  }, [containerRef, items]);

  const handleClick = useCallback(
    (id: string) => {
      const container = containerRef.current;
      if (!container) return;
      const el = container.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!el) return;

      clickScrollingRef.current = true;
      setClickActiveId(id);

      const top = headingTopInContainer(el, container) - SCROLL_SPY_OFFSET;
      container.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });

      window.setTimeout(() => {
        clickScrollingRef.current = false;
        setClickActiveId(null);
      }, 800);
    },
    [containerRef],
  );

  if (items.length < 2) return null;

  const minLevel = Math.min(...items.map((item) => item.level));

  return (
    <nav
      aria-label="On this page"
      className={cn("min-h-0 overflow-y-auto", className)}
    >
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        On this page
      </p>
      <ul className="border-l border-border">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleClick(item.id)}
                style={{
                  paddingLeft: `${(item.level - minLevel) * 12 + 12}px`,
                }}
                className={cn(
                  "-ml-px block w-full border-l-2 py-1 pr-3 text-left text-[13px] leading-snug transition-colors",
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {item.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
