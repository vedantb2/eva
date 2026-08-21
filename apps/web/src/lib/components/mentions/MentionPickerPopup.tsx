"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { m } from "motion/react";
import { IconSearch } from "@tabler/icons-react";
import { motionFast } from "@eva/ui";
import type { MentionPopupPlacement } from "./mentionPopupPosition";

interface MentionPickerPopupProps<TItem extends { id: string }> {
  title: string;
  placement: MentionPopupPlacement;
  items: TItem[];
  selectedIndex: number;
  renderItem: (item: TItem, isSelected: boolean) => ReactNode;
  onSelectItem: (item: TItem) => void;
  emptyContent?: ReactNode;
  /** Text typed after the `@`/`/` trigger, i.e. what the list is filtered by. */
  query: string;
  /** Returns the caret to the editor, so clicking the search row keeps typing alive. */
  onRefocusEditor: () => void;
}

export function MentionPickerPopup<TItem extends { id: string }>({
  title,
  placement,
  items,
  selectedIndex,
  renderItem,
  onSelectItem,
  emptyContent,
  query,
  onRefocusEditor,
}: MentionPickerPopupProps<TItem>) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.querySelector<HTMLElement>(
      '[data-mention-picker-item][data-selected="true"]',
    );
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, items.length]);

  const isAbove = placement.placement === "above";

  return (
    /**
     * Positioning is split from the animated box on purpose. The `above`
     * placement is expressed as `translateY(-100%)`, and Motion owns `transform`
     * on the element it animates — so the offset lives on this wrapper, where it
     * still snaps as the caret moves, and the box inside only ever scales and
     * fades. Flipping above/below therefore re-anchors instantly rather than
     * sliding the popup across the caret.
     */
    <div
      className="fixed z-50"
      style={{
        left: placement.left,
        top: placement.top,
        width: placement.width,
        transform: isAbove ? "translateY(-100%)" : undefined,
      }}
    >
      {/*
        Enter and exit along the same path. This used to be
        `animate-in fade-in-0 zoom-in-95 duration-150` with no `animate-out`, and
        the popup is conditionally unmounted rather than driven by a Radix
        `data-state`, so it grew in over 150ms and then disappeared in a single
        frame — the one asymmetric overlay left in the app. `AnimatePresence` in
        `MentionEditor` holds it mounted long enough to leave.

        The origin is the caret-facing edge, so it scales out of the text rather
        than out of its own middle.
      */}
      <m.div
        role="listbox"
        aria-label={title}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={motionFast}
        style={{ maxHeight: placement.maxHeight }}
        className={
          "flex flex-col overflow-hidden rounded-surface " +
          "bg-popover/95 text-popover-foreground backdrop-blur-md smooth-shadow-ring-lg " +
          (isAbove ? "origin-bottom" : "origin-top")
        }
      >
        {/* The caret has to stay in the editor — that is where the query is being
          typed and where the chip will be inserted — so this is a live view of
          the filter rather than a focusable field. Clicking it hands focus back
          to the editor so typing continues to narrow the list. */}
        <div
          className="flex shrink-0 items-center gap-2 border-b border-border px-2.5 py-2"
          onMouseDown={(e) => {
            e.preventDefault();
            onRefocusEditor();
          }}
        >
          <IconSearch size={13} className="shrink-0 text-muted-foreground" />
          <span
            className={
              "min-w-0 flex-1 truncate text-sm " +
              (query ? "text-foreground" : "text-muted-foreground/70")
            }
          >
            {query || `Search ${title.toLowerCase()}…`}
          </span>
        </div>
        {items.length > 0 ? (
          <div
            ref={listRef}
            className="scrollbar scroll-fade min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
          >
            {items.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-mention-picker-item
                  data-selected={isSelected ? "true" : "false"}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectItem(item);
                  }}
                  className={
                    // `max-sm:py-2.5` takes the row to a 40px tap target on a
                    // phone without loosening the dense desktop list.
                    "mx-1 flex w-[calc(100%-0.5rem)] min-w-0 items-center rounded-lg px-2 py-1.5 text-left text-sm max-sm:py-2.5 " +
                    "transition-[background-color] " +
                    (isSelected
                      ? "bg-primary/15 font-medium text-foreground dark:bg-primary/25"
                      : "text-foreground/90 hover:bg-muted")
                  }
                >
                  {renderItem(item, isSelected)}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-2.5 pb-2.5 text-xs leading-relaxed text-muted-foreground">
            {emptyContent}
          </div>
        )}
      </m.div>
    </div>
  );
}
