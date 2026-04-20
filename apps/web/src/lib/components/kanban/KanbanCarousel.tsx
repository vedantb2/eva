"use client";

import { useState, useMemo, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@conductor/ui";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const MAX_VISIBLE_COLUMNS = 5;

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

  const needsCarousel = items.length > MAX_VISIBLE_COLUMNS;

  const visibleItems = useMemo(() => {
    if (!needsCarousel) return items;
    return items.slice(startIndex, startIndex + MAX_VISIBLE_COLUMNS);
  }, [items, startIndex, needsCarousel]);

  const canGoBack = startIndex > 0;
  const canGoForward = startIndex + MAX_VISIBLE_COLUMNS < items.length;

  const goBack = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const goForward = () => {
    setStartIndex((prev) =>
      Math.min(items.length - MAX_VISIBLE_COLUMNS, prev + 1),
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
