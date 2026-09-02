import type { ReactNode } from "react";

/**
 * Pads the latest turn to the scroll viewport so stick-to-bottom places the
 * latest user message near the top (Cursor-style). Older messages stay above
 * and remain reachable by scrolling up. As the assistant reply grows past the
 * viewport, stick-to-bottom follows the bottom of the turn as usual.
 *
 * `min-height` is `100cqh` of the conversation scroller (see
 * `scrollClassName` on `ConversationContent`) so it tracks the viewport in
 * the same layout pass as the composer growing or collapsing. A ResizeObserver
 * + React state would apply one frame late, which dropped the thread then
 * jumped it back when the pill snapped shut.
 *
 * Must render inside `<Conversation>` / StickToBottom. Subtracts the
 * `p-3` (0.75rem) on ConversationContent so the turn's top aligns with the
 * viewport when stuck to bottom.
 */
export function ChatLastTurn({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100cqh-0.75rem)] flex-col gap-3">
      {children}
    </div>
  );
}
