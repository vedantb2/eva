import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { cn } from "@eva/ui";
import { tokenizedToDisplayText } from "@/lib/components/mentions";
import type { ChatJumpAnchor } from "./chatTimeline";

const ITEM_SPACING_PX = 8;
const MIN_VISIBLE_TICKS = 2;
const MAX_HEIGHT_CSS = "calc(100vh - 18rem)";

interface ChatJumpRailProps {
  anchors: ReadonlyArray<ChatJumpAnchor>;
  visibleRange: { startIndex: number; endIndex: number } | null;
  onJump: (rowIndex: number) => void;
}

interface Tick extends ChatJumpAnchor {
  userText: string;
  assistantText: string | null;
}

function toPreview(content: string): string {
  return tokenizedToDisplayText(content).replace(/\s+/g, " ").trim();
}

function resolveRailHeightStyle(itemCount: number): string {
  const naturalHeight = Math.max(1, (itemCount - 1) * ITEM_SPACING_PX);
  return `min(${naturalHeight}px, ${MAX_HEIGHT_CSS})`;
}

function resolveTopPercent(index: number, itemCount: number): number {
  if (itemCount <= 1) return 0;
  return (Math.max(0, Math.min(index, itemCount - 1)) / (itemCount - 1)) * 100;
}

function resolveIndexFromPointer(input: {
  itemCount: number;
  railTop: number;
  railHeight: number;
  pointerY: number;
}): number | null {
  if (input.itemCount <= 0 || input.railHeight <= 0) return null;
  if (input.itemCount === 1) return 0;
  const progress = Math.max(
    0,
    Math.min(1, (input.pointerY - input.railTop) / input.railHeight),
  );
  return Math.max(
    0,
    Math.min(input.itemCount - 1, Math.round(progress * (input.itemCount - 1))),
  );
}

/** Loaded-history minimap backed by Virtuoso row indexes. */
export function ChatJumpRail({
  anchors,
  visibleRange,
  onJump,
}: ChatJumpRailProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const ticks: Tick[] = anchors.map((anchor) => {
    const userText = toPreview(anchor.content);
    const assistantText = anchor.reply ? toPreview(anchor.reply) : "";
    return {
      ...anchor,
      userText: userText.length > 0 ? userText : "Message",
      assistantText: assistantText.length > 0 ? assistantText : null,
    };
  });

  const resolveHoverIndexFromPointer = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return resolveIndexFromPointer({
      itemCount: ticks.length,
      railTop: rect.top,
      railHeight: rect.height,
      pointerY: event.clientY,
    });
  };

  const moveHoverIndex = (delta: number) => {
    setHoverIndex((current) => {
      const base = current ?? 0;
      return Math.max(0, Math.min(ticks.length - 1, base + delta));
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveHoverIndex(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveHoverIndex(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setHoverIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setHoverIndex(ticks.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const active = hoverIndex === null ? null : (ticks[hoverIndex] ?? null);
      if (active) onJump(active.rowIndex);
    }
  };

  if (ticks.length < MIN_VISIBLE_TICKS) return null;

  const resolvedHoverIndex =
    hoverIndex !== null && hoverIndex < ticks.length ? hoverIndex : null;
  const activeTick =
    resolvedHoverIndex === null ? null : (ticks[resolvedHoverIndex] ?? null);
  const activeTopPercent =
    resolvedHoverIndex === null
      ? 0
      : resolveTopPercent(resolvedHoverIndex, ticks.length);
  const activeTooltipTranslate =
    resolvedHoverIndex === null
      ? "-50%"
      : resolvedHoverIndex === 0
        ? "0%"
        : resolvedHoverIndex === ticks.length - 1
          ? "-100%"
          : "-50%";

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-30 hidden w-14 lg:[@media(pointer:fine)]:block"
      aria-label="Jump to message"
      data-testid="chat-jump-rail"
    >
      <div className="relative h-full w-full select-none">
        <button
          type="button"
          aria-label={`Jump to message: ${activeTick?.userText ?? "User message"}`}
          className="pointer-events-auto absolute top-1/2 left-2 w-10 -translate-y-1/2 cursor-pointer bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          style={{ height: resolveRailHeightStyle(ticks.length) }}
          onBlur={() => setHoverIndex(null)}
          onFocus={() => setHoverIndex((current) => current ?? 0)}
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(event) => {
            setHoverIndex(resolveHoverIndexFromPointer(event));
          }}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={(event) => {
            const nextIndex = resolveHoverIndexFromPointer(event);
            const nextTick =
              nextIndex === null ? null : (ticks[nextIndex] ?? null);
            if (nextTick) onJump(nextTick.rowIndex);
            event.currentTarget.blur();
          }}
          onKeyDown={handleKeyDown}
        >
          <div className="absolute top-0 left-3 h-full w-px bg-border/15" />
          {ticks.map((tick, index) => {
            const top = `${resolveTopPercent(index, ticks.length)}%`;
            const activeDistance =
              resolvedHoverIndex === null
                ? null
                : Math.abs(index - resolvedHoverIndex);
            const inView =
              visibleRange !== null &&
              tick.rowIndex >= visibleRange.startIndex &&
              tick.rowIndex <= visibleRange.endIndex;
            return (
              <span
                key={tick.id}
                aria-hidden="true"
                data-in-view={inView ? "true" : "false"}
                className={cn(
                  "pointer-events-none absolute left-0 h-0.5 -translate-y-1/2 rounded-full bg-muted-foreground/35 transition-[background-color,width] duration-150 data-[in-view=true]:bg-foreground/90",
                  activeDistance === 0
                    ? "w-6 bg-muted-foreground/75"
                    : activeDistance === 1
                      ? "w-4"
                      : activeDistance === 2
                        ? "w-2.5"
                        : "w-2",
                )}
                style={{ top }}
              />
            );
          })}
          {activeTick ? (
            <span
              className="pointer-events-none absolute left-8 w-80 rounded-xl bg-popover/95 p-3 text-left text-popover-foreground smooth-shadow-ring-xl backdrop-blur"
              style={{
                top: `${activeTopPercent}%`,
                transform: `translateY(${activeTooltipTranslate})`,
              }}
            >
              <span className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-5">
                {activeTick.userText}
              </span>
              {activeTick.assistantText ? (
                <span className="mt-1 line-clamp-3 text-sm leading-5 text-muted-foreground">
                  {activeTick.assistantText}
                </span>
              ) : null}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
