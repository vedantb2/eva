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
  /** When set (e.g. from editor cursor), takes precedence over scroll spy. */
  preferredActiveId?: string | null;
}

/**
 * Scroll-spy "On this page" navigation for doc content.
 *
 * Scans the rendered DOM after paint, assigns stable ids, and builds the
 * section list from what is actually on screen. Highlights the section under
 * the cursor when provided, otherwise the section nearest the scroll top.
 */
export function FloatingToc({
  containerRef,
  content,
  className,
  preferredActiveId,
}: FloatingTocProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [scrollActiveId, setScrollActiveId] = useState<string | null>(null);
  const [clickActiveId, setClickActiveId] = useState<string | null>(null);
  const clickScrollingRef = useRef(false);

  const activeId =
    clickActiveId ??
    preferredActiveId ??
    scrollActiveId ??
    items[0]?.id ??
    null;

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

  // Highlight whichever section sits nearest the top while scrolling.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const updateFromScroll = () => {
      if (clickScrollingRef.current) return;

      const containerTop = container.getBoundingClientRect().top;
      let best: { id: string; top: number } | null = null;

      for (const item of items) {
        const el = container.querySelector(`#${CSS.escape(item.id)}`);
        if (!el) continue;
        const top = el.getBoundingClientRect().top - containerTop;
        if (top <= 96 && (!best || top > best.top)) {
          best = { id: item.id, top };
        }
      }

      setScrollActiveId(best?.id ?? items[0]?.id ?? null);
    };

    updateFromScroll();
    container.addEventListener("scroll", updateFromScroll, { passive: true });
    return () => container.removeEventListener("scroll", updateFromScroll);
  }, [containerRef, items]);

  const handleClick = useCallback(
    (id: string) => {
      const el = containerRef.current?.querySelector<HTMLElement>(
        `#${CSS.escape(id)}`,
      );
      if (!el) return;
      clickScrollingRef.current = true;
      setClickActiveId(id);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        clickScrollingRef.current = false;
        setClickActiveId(null);
      }, 600);
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
