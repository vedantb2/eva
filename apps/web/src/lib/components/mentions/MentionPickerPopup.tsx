"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { MentionPopupPlacement } from "./mentionPopupPosition";

interface MentionPickerPopupProps<TItem extends { id: string }> {
  title: string;
  placement: MentionPopupPlacement;
  items: TItem[];
  selectedIndex: number;
  renderItem: (item: TItem, isSelected: boolean) => ReactNode;
  onSelectItem: (item: TItem) => void;
  emptyContent?: ReactNode;
}

export function MentionPickerPopup<TItem extends { id: string }>({
  title,
  placement,
  items,
  selectedIndex,
  renderItem,
  onSelectItem,
  emptyContent,
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

  const slideClass =
    placement.placement === "above"
      ? "origin-bottom slide-in-from-bottom-1"
      : "origin-top slide-in-from-top-1";

  return (
    <div
      role="listbox"
      aria-label={title}
      className={
        "fixed z-50 flex flex-col overflow-hidden rounded-lg border border-border " +
        "bg-popover text-popover-foreground shadow-lg " +
        "animate-in fade-in-0 zoom-in-95 duration-150 " +
        slideClass
      }
      style={{
        left: placement.left,
        top: placement.top,
        width: placement.width,
        maxHeight: placement.maxHeight,
        transform:
          placement.placement === "above" ? "translateY(-100%)" : undefined,
      }}
    >
      <p className="shrink-0 px-2.5 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
        {title}
      </p>
      {items.length > 0 ? (
        <div
          ref={listRef}
          className="scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
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
                  "mx-1 flex w-[calc(100%-0.5rem)] min-w-0 items-center rounded-md px-2 py-1.5 text-left text-sm " +
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
    </div>
  );
}
