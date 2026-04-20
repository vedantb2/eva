"use client";

import { useState, useMemo, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@conductor/ui";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

const MAX_VISIBLE_COLUMNS_MOBILE = 2;
const MAX_VISIBLE_COLUMNS_DESKTOP = 5;

interface KanbanCarouselProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderColumn: (item: T) => ReactNode;
  fillHeight?: boolean;
}

export function KanbanCarousel<T>({
  items,
  getKey,
  renderColumn,
  fillHeight = false,
}: KanbanCarouselProps<T>) {
  const [startIndex, setStartIndex] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const maxVisibleColumns = isDesktop
    ? MAX_VISIBLE_COLUMNS_DESKTOP
    : MAX_VISIBLE_COLUMNS_MOBILE;

  const needsCarousel = items.length > maxVisibleColumns;

  const visibleItems = useMemo(() => {
    if (!needsCarousel) return items;
    const safeStartIndex = Math.min(
      startIndex,
      Math.max(0, items.length - maxVisibleColumns),
    );
    return items.slice(safeStartIndex, safeStartIndex + maxVisibleColumns);
  }, [items, startIndex, needsCarousel, maxVisibleColumns]);

  const canGoBack = startIndex > 0;
  const canGoForward = startIndex + maxVisibleColumns < items.length;

  const goBack = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const goForward = () => {
    setStartIndex((prev) =>
      Math.min(items.length - maxVisibleColumns, prev + 1),
    );
  };

  return (
    <div
      className={`flex w-full items-stretch gap-0 ${
        fillHeight ? "min-h-0 min-w-0 flex-1" : ""
      }`}
    >
      {needsCarousel && (
        <div className="flex flex-shrink-0 items-center pr-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full transition-[transform,background-color]"
            onClick={goBack}
            disabled={!canGoBack}
          >
            <IconChevronLeft size={18} />
          </Button>
        </div>
      )}
      <div
        className={`flex w-full items-stretch gap-2 sm:gap-3 ${
          fillHeight ? "min-h-0 min-w-0 flex-1 overflow-hidden" : ""
        }`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {visibleItems.map((item) => (
            <motion.div
              key={getKey(item)}
              layout
              className="flex min-h-0 min-w-0 flex-1 self-stretch"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {renderColumn(item)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {needsCarousel && (
        <div className="flex flex-shrink-0 items-center pl-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full transition-[transform,background-color]"
            onClick={goForward}
            disabled={!canGoForward}
          >
            <IconChevronRight size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
