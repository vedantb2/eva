"use client";

import { Button, Spinner } from "@eva/ui";
import { IconChevronDown } from "@tabler/icons-react";
// eslint-disable-next-line no-restricted-imports -- A submitted local turn must scroll after Virtuoso commits its row.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Virtuoso, type Components, type VirtuosoHandle } from "react-virtuoso";
import { ChatJumpRail } from "./ChatJumpRail";
import type { ChatJumpAnchor, ChatTimelineRow } from "./chatTimeline";

/** Same debounce as ConversationScrollButton — avoid flashing on brief settles. */
const SHOW_SCROLL_TO_END_DEBOUNCE_MS = 150;

interface ChatVirtualizedTimelineProps {
  conversationId: string;
  rows: ReadonlyArray<ChatTimelineRow>;
  firstItemIndex: number;
  anchors: ReadonlyArray<ChatJumpAnchor>;
  canLoadOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  localTurnId?: string;
  emptyState: ReactNode;
  footer?: ReactNode;
  renderRow: (row: ChatTimelineRow, index: number) => ReactNode;
}

interface ChatTimelineContext {
  canLoadOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  footer?: ReactNode;
}

// Keep component identities stable so Virtuoso does not remount its structure
// whenever scrolling updates this timeline's visible range.
const TIMELINE_COMPONENTS: Components<ChatTimelineRow, ChatTimelineContext> = {
  Header: ({ context }) => {
    if (!context.canLoadOlder && !context.isLoadingOlder) {
      return (
        <div className="mx-auto w-full max-w-3xl px-3 py-2 text-center text-xs text-muted-foreground">
          Start of conversation
        </div>
      );
    }

    return (
      <div className="mx-auto flex w-full max-w-3xl justify-center px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={context.isLoadingOlder}
          onClick={context.onLoadOlder}
        >
          {context.isLoadingOlder ? <Spinner size="sm" /> : null}
          {context.isLoadingOlder ? "Loading history…" : "Load older messages"}
        </Button>
      </div>
    );
  },
  Footer: ({ context }) =>
    context.footer ? (
      <div className="mx-auto w-full max-w-3xl px-3 pb-3">{context.footer}</div>
    ) : null,
};

/** Virtuoso owns the chat viewport, prepend anchor, bottom-follow, and jumps. */
export function ChatVirtualizedTimeline({
  conversationId,
  rows,
  firstItemIndex,
  anchors,
  canLoadOlder,
  isLoadingOlder,
  onLoadOlder,
  localTurnId,
  emptyState,
  footer,
  renderRow,
}: ChatVirtualizedTimelineProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToEnd, setShowScrollToEnd] = useState(false);
  const [visibleRange, setVisibleRange] = useState<{
    startIndex: number;
    endIndex: number;
  } | null>(null);

  useEffect(() => {
    if (!localTurnId || rows.length === 0) return;
    virtuosoRef.current?.scrollToIndex({
      index: "LAST",
      align: "end",
      behavior: "smooth",
    });
  }, [localTurnId, rows.length]);

  useEffect(() => {
    if (showTimerRef.current !== null) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    setShowScrollToEnd(false);
  }, [conversationId]);

  useEffect(() => {
    if (showTimerRef.current !== null) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }

    if (isAtBottom) {
      setShowScrollToEnd(false);
      return;
    }

    showTimerRef.current = setTimeout(() => {
      setShowScrollToEnd(true);
      showTimerRef.current = null;
    }, SHOW_SCROLL_TO_END_DEBOUNCE_MS);

    return () => {
      if (showTimerRef.current !== null) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
    };
  }, [isAtBottom]);

  if (rows.length === 0) {
    return <div className="flex min-h-0 flex-1">{emptyState}</div>;
  }

  function scrollToEnd() {
    if (showTimerRef.current !== null) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    setShowScrollToEnd(false);
    virtuosoRef.current?.scrollToIndex({
      index: "LAST",
      align: "end",
      behavior: "smooth",
    });
  }

  return (
    <div className="relative min-h-0 flex-1">
      <Virtuoso
        key={conversationId}
        ref={virtuosoRef}
        className="scrollbar scroll-fade h-full"
        data={rows}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={{ index: "LAST", align: "end" }}
        computeItemKey={(_index, row) => row.id}
        components={TIMELINE_COMPONENTS}
        context={{
          canLoadOlder,
          isLoadingOlder,
          onLoadOlder,
          footer,
        }}
        itemContent={(index, row) => (
          <div className="mx-auto w-full max-w-3xl px-3 pb-3">
            {renderRow(row, index - firstItemIndex)}
          </div>
        )}
        startReached={() => {
          if (canLoadOlder && !isLoadingOlder) onLoadOlder();
        }}
        followOutput={(atBottom) => (atBottom ? "auto" : false)}
        atBottomStateChange={setIsAtBottom}
        rangeChanged={(range) => {
          setVisibleRange({
            startIndex: Math.max(0, range.startIndex - firstItemIndex),
            endIndex: Math.max(0, range.endIndex - firstItemIndex),
          });
        }}
      />
      {showScrollToEnd ? (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 justify-center">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="pointer-events-auto h-7 gap-1.5 rounded-full border border-border/60 bg-card px-3 text-xs font-normal text-muted-foreground hover:border-border hover:bg-card hover:text-foreground"
            aria-label="Scroll to end"
            title="Scroll to end"
            onClick={scrollToEnd}
          >
            <IconChevronDown className="size-3.5" />
            Scroll to end
          </Button>
        </div>
      ) : null}
      <ChatJumpRail
        anchors={anchors}
        visibleRange={visibleRange}
        onJump={(rowIndex) => {
          virtuosoRef.current?.scrollToIndex({
            index: firstItemIndex + rowIndex,
            align: "start",
            behavior: "smooth",
          });
        }}
      />
    </div>
  );
}
