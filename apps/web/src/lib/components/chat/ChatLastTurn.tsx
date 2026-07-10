"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";

/**
 * Pads the latest turn to the scroll viewport height so stick-to-bottom
 * places the latest user message near the top (Cursor-style). Older
 * messages stay above and remain reachable by scrolling up. As the
 * assistant reply grows past the viewport, stick-to-bottom follows the
 * bottom of the turn as usual.
 *
 * Must render inside `<Conversation>` / StickToBottom.
 */
export function ChatLastTurn({ children }: { children: ReactNode }) {
  const { scrollRef } = useStickToBottomContext();
  const [minHeight, setMinHeight] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      // ConversationContent uses p-3 (12px). Subtract bottom padding so the
      // turn's top aligns with the viewport top when stuck to bottom.
      setMinHeight(Math.max(0, el.clientHeight - 12));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRef]);

  return (
    <div
      className="flex flex-col gap-3"
      style={minHeight > 0 ? { minHeight } : undefined}
    >
      {children}
    </div>
  );
}
