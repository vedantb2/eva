import { Button, Spinner } from "@eva/ui";
import { IconArrowDown } from "@tabler/icons-react";
// eslint-disable-next-line no-restricted-imports -- A submitted local turn must scroll after Virtuoso commits its row.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Virtuoso, type Components, type VirtuosoHandle } from "react-virtuoso";
import { ChatJumpRail } from "./ChatJumpRail";
import type { ChatJumpAnchor, ChatTimelineRow } from "./chatTimeline";

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
  const [isAtBottom, setIsAtBottom] = useState(true);
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

  if (rows.length === 0) {
    return <div className="flex min-h-0 flex-1">{emptyState}</div>;
  }

  return (
    <div className="relative min-h-0 flex-1">
      <Virtuoso
        key={conversationId}
        ref={virtuosoRef}
        className="h-full"
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
      {!isAtBottom ? (
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          className="absolute right-4 bottom-4 z-20 rounded-full bg-background/95 shadow-md"
          aria-label="Scroll to latest message"
          onClick={() => {
            virtuosoRef.current?.scrollToIndex({
              index: "LAST",
              align: "end",
              behavior: "smooth",
            });
          }}
        >
          <IconArrowDown className="size-4" />
        </Button>
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
