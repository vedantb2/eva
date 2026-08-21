"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { IconSearch } from "@tabler/icons-react";
import type { MentionPopupPlacement } from "./mentionPopupPosition";

/**
 * `caret` is the compact list next to the caret (comment boxes, modals, task
 * descriptions). `panel` is the full-width sheet above the chat composer, which
 * owns a real focusable search field.
 */
export type MentionPopupLayout = "caret" | "panel";

interface MentionPickerPopupProps<TItem extends { id: string }> {
  title: string;
  layout: MentionPopupLayout;
  placement: MentionPopupPlacement;
  items: TItem[];
  selectedIndex: number;
  renderItem: (item: TItem, isSelected: boolean) => ReactNode;
  onSelectItem: (item: TItem) => void;
  /** Shown when there is nothing to list at all; otherwise "No matches". */
  emptyContent?: ReactNode;
  /** Text the list is filtered by — typed after `@`/`/`, or in the search field. */
  query: string;
  /** `panel` only: the search field is the live filter. */
  onQueryChange: (query: string) => void;
  /** `panel` only: arrow/enter/escape from the search field. */
  onQueryKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  /** Focus left the picker for something that is not the editor. */
  onDismiss: () => void;
  /** `caret` only: returns the caret to the editor so typing keeps filtering. */
  onRefocusEditor: () => void;
}

export function MentionPickerPopup<TItem extends { id: string }>({
  title,
  layout,
  placement,
  items,
  selectedIndex,
  renderItem,
  onSelectItem,
  emptyContent,
  query,
  onQueryChange,
  onQueryKeyDown,
  onDismiss,
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

  const slideClass =
    placement.placement === "above"
      ? "origin-bottom slide-in-from-bottom-1"
      : "origin-top slide-in-from-top-1";
  const searchPlaceholder = `Search ${title.toLowerCase()}…`;

  return (
    <div
      data-mention-picker="true"
      aria-label={title}
      className={
        "fixed z-50 flex flex-col overflow-hidden rounded-surface " +
        "bg-popover/95 text-popover-foreground backdrop-blur-md smooth-shadow-ring-lg " +
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
      onBlur={(e) => {
        const next = e.relatedTarget;
        if (
          next instanceof Element &&
          next.closest("[data-mention-picker]") !== null
        ) {
          return;
        }
        onDismiss();
      }}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
        <IconSearch size={14} className="shrink-0 text-muted-foreground" />
        {layout === "panel" ? (
          // The caret stays in the editor (that is where the chip lands), so the
          // field owns the filter instead of mirroring the typed text. Spaces
          // work here, which they cannot in the editor — a space ends the
          // `@`/`/` trigger.
          <input
            // Opening the picker is the user asking to search, so typing has to
            // land here rather than back in the draft.
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onQueryKeyDown}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground/70"
          />
        ) : (
          // Compact layout keeps the caret in the editor — inside a modal the
          // focus trap would pull focus straight back out of a real field — so
          // this is a live view of the filter rather than an input.
          <span
            onMouseDown={(e) => {
              e.preventDefault();
              onRefocusEditor();
            }}
            className={
              "min-w-0 flex-1 truncate text-sm " +
              (query ? "text-foreground" : "text-muted-foreground/70")
            }
          >
            {query || searchPlaceholder}
          </span>
        )}
      </div>
      {items.length > 0 ? (
        <div
          ref={listRef}
          role="listbox"
          aria-label={title}
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
        <div className="px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          {emptyContent ?? "No matches."}
        </div>
      )}
    </div>
  );
}
