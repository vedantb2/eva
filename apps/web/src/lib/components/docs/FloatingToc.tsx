"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { cn } from "@conductor/ui";

// Which heading levels to surface in the table of contents. Deeper headings
// (h4+) are intentionally omitted to keep the rail readable for long PRDs.
const HEADING_SELECTOR = "h1, h2, h3";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Turn heading text into a DOM-safe, human-readable id fragment.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface FloatingTocProps {
  // Scroll container holding the rendered markdown headings. Doubles as the
  // IntersectionObserver root so active-section tracking respects its scroll.
  containerRef: RefObject<HTMLElement | null>;
  // Re-scan headings whenever the rendered markdown changes.
  content: string;
  className?: string;
}

/**
 * Scroll-spy "On this page" navigation for rendered markdown (PRDs/docs).
 *
 * Streamdown owns the heading nodes, so rather than parse markdown ourselves we
 * scan the rendered DOM after paint, assign stable ids, and build the section
 * list from what is actually on screen. An IntersectionObserver rooted on the
 * scroll container highlights the section nearest the top, and clicking an item
 * smooth-scrolls to it. Renders nothing when there are too few headings to be
 * worth a TOC.
 */
export function FloatingToc({
  containerRef,
  content,
  className,
}: FloatingTocProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Suppress observer-driven highlight changes during a click-scroll so the
  // clicked item stays active until the smooth scroll settles.
  const clickScrollingRef = useRef(false);

  // Scan rendered headings, assign ids, build the section list.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Wait for Streamdown to paint this content before scanning.
    const raf = requestAnimationFrame(() => {
      const headings = Array.from(
        container.querySelectorAll<HTMLHeadingElement>(HEADING_SELECTOR),
      );
      const seen = new Map<string, number>();
      const next: TocItem[] = headings.map((el) => {
        const text = el.textContent?.trim() ?? "";
        const base = slugify(text) || "section";
        const count = seen.get(base) ?? 0;
        seen.set(base, count + 1);
        const id = count === 0 ? base : `${base}-${count}`;
        el.id = id;
        return { id, text, level: Number(el.tagName.slice(1)) };
      });
      setItems(next);
    });
    return () => cancelAnimationFrame(raf);
  }, [containerRef, content]);

  // Highlight whichever section sits nearest the top of the scroll container.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (clickScrollingRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const topId = visible[0]?.target.id;
        if (topId) setActiveId(topId);
      },
      {
        root: container,
        // Activate a heading once it crosses into the top third of the view.
        rootMargin: "0px 0px -66% 0px",
        threshold: 0,
      },
    );

    for (const item of items) {
      const el = container.querySelector(`#${CSS.escape(item.id)}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [containerRef, items]);

  const handleClick = useCallback(
    (id: string) => {
      const el = containerRef.current?.querySelector<HTMLElement>(
        `#${CSS.escape(id)}`,
      );
      if (!el) return;
      clickScrollingRef.current = true;
      setActiveId(id);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Re-enable observer-driven highlighting after the scroll settles.
      window.setTimeout(() => {
        clickScrollingRef.current = false;
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
