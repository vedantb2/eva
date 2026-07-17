"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { Tooltip, TooltipTrigger, TooltipContent, cn } from "@conductor/ui";
import { tokenizedToDisplayText } from "@/lib/components/mentions";

const MIN_VISIBLE_TICKS = 2;

export interface ChatJumpRailMessage {
  id: string;
  content: string;
  /** Plain-text preview of the assistant reply that follows this user turn. */
  reply?: string;
}

interface ChatJumpRailProps {
  messages: ChatJumpRailMessage[];
}

function toPreview(content: string): string {
  return tokenizedToDisplayText(content).replace(/\s+/g, " ").trim();
}

/**
 * Compact vertical rail centered beside the chat, one tick per user message —
 * click, Enter/Space, or arrow keys jump to that turn. Must render inside
 * `<Conversation>` (StickToBottom) so it can read the shared scroll viewport
 * and resolve `[data-message-id]` targets within it.
 */
export function ChatJumpRail({ messages }: ChatJumpRailProps) {
  const { scrollRef } = useStickToBottomContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const ticks = useMemo(
    () =>
      messages.map((message) => ({
        id: message.id,
        preview: toPreview(message.content),
        replyPreview: message.reply ? toPreview(message.reply) : "",
      })),
    [messages],
  );

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport || ticks.length < MIN_VISIBLE_TICKS) return;

    const targets = ticks
      .map((tick) =>
        viewport.querySelector<HTMLElement>(`[data-message-id="${tick.id}"]`),
      )
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // A turn counts as "read" once it crosses the top 30% of the viewport —
    // tracks the reader's position without needing list virtualization.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
        );
        const id = topmost.target.getAttribute("data-message-id");
        if (id) setActiveId(id);
      },
      { root: viewport, rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [scrollRef, ticks]);

  const scrollToTick = useCallback(
    (id: string) => {
      const viewport = scrollRef.current;
      const target = viewport?.querySelector<HTMLElement>(
        `[data-message-id="${id}"]`,
      );
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [scrollRef],
  );

  if (ticks.length < MIN_VISIBLE_TICKS) return null;

  return (
    <div
      className="pointer-events-none absolute left-1 top-1/2 z-30 hidden w-8 -translate-y-1/2 lg:[@media(pointer:fine)]:block"
      aria-label="Jump to message"
    >
      <div className="flex max-h-[min(20rem,60vh)] flex-col items-center gap-1.5 overflow-y-auto">
        {ticks.map((tick, index) => {
          const isActive = tick.id === activeId;
          return (
            <Tooltip key={tick.id}>
              <TooltipTrigger asChild>
                <button
                  ref={(el) => {
                    buttonRefs.current[index] = el;
                  }}
                  type="button"
                  aria-label={`Jump to message: ${tick.preview || "message"}`}
                  className={cn(
                    "pointer-events-auto h-0.5 w-4 shrink-0 rounded-full bg-muted-foreground/35 transition-[background-color,width] duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    isActive && "w-6 bg-foreground/80",
                  )}
                  onClick={() => scrollToTick(tick.id)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      buttonRefs.current[
                        Math.min(ticks.length - 1, index + 1)
                      ]?.focus();
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      buttonRefs.current[Math.max(0, index - 1)]?.focus();
                    } else if (event.key === "Home") {
                      event.preventDefault();
                      buttonRefs.current[0]?.focus();
                    } else if (event.key === "End") {
                      event.preventDefault();
                      buttonRefs.current[ticks.length - 1]?.focus();
                    }
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-64 space-y-0.5">
                <p className="truncate">{tick.preview || "Message"}</p>
                {tick.replyPreview ? (
                  <p className="truncate text-muted-foreground">
                    {tick.replyPreview}
                  </p>
                ) : null}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
