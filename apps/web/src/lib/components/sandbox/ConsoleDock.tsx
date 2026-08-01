import { useRef, useState, type ReactNode } from "react";
import { cn } from "@eva/ui";
import {
  IconChevronDown,
  IconChevronUp,
  IconTerminal2,
} from "@tabler/icons-react";
import { useLocalStorage } from "usehooks-ts";

interface ConsoleDockState {
  expanded: boolean;
  /** Preview height as a percentage of the dock; the console fills the rest. */
  previewPct: number;
}

const DEFAULT_STATE: ConsoleDockState = { expanded: false, previewPct: 60 };
const MIN_PREVIEW_PCT = 15;
const MAX_PREVIEW_PCT = 85;

interface ConsoleDockProps {
  /** Full localStorage key for the expanded state + split ratio. */
  storageKey: string;
  /** Top region — the web preview. */
  preview: ReactNode;
  /**
   * Bottom "Console" region. `visible` is true only when expanded and not
   * mid-drag, so the caller can gate the terminal's foreground fit/resize.
   */
  renderConsole: (visible: boolean) => ReactNode;
}

/**
 * Stacks the web preview over a collapsible "Console" row. Collapsed by default;
 * when expanded the two rows share the height at `previewPct` with a draggable
 * divider. Both regions stay mounted across toggle/drag (CSS-only hide) so the
 * preview iframe and the console PTY never remount.
 */
export function ConsoleDock({
  storageKey,
  preview,
  renderConsole,
}: ConsoleDockProps) {
  const [state, setState] = useLocalStorage<ConsoleDockState>(
    storageKey,
    DEFAULT_STATE,
  );
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { expanded, previewPct } = state;

  const toggle = () => {
    setState((s) => ({ ...s, expanded: !s.expanded }));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.height === 0) return;
    const pct = ((e.clientY - rect.top) / rect.height) * 100;
    const clamped = Math.min(MAX_PREVIEW_PCT, Math.max(MIN_PREVIEW_PCT, pct));
    setState((s) => ({ ...s, previewPct: clamped }));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn("flex h-full min-h-0 flex-col", dragging && "select-none")}
    >
      <div
        className={cn(
          "min-h-0",
          expanded ? "shrink-0 grow-0" : "flex-1",
          // Iframes swallow pointer events; disable them so the drag continues.
          dragging && "pointer-events-none",
        )}
        style={expanded ? { height: `${previewPct}%` } : undefined}
      >
        {preview}
      </div>

      {expanded ? (
        <div className="relative h-0">
          <div
            role="separator"
            aria-orientation="horizontal"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="absolute inset-x-0 -top-1 z-10 h-2.5 cursor-row-resize touch-none"
          />
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={expanded}
        onClick={toggle}
        className="flex h-9 shrink-0 items-center justify-between border-t border-border px-3 text-muted-foreground transition-colors hover:bg-secondary"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <IconTerminal2 className="size-3.5" />
          Console
        </span>
        {expanded ? (
          <IconChevronDown className="size-4" />
        ) : (
          <IconChevronUp className="size-4" />
        )}
      </button>

      <div
        className={cn(
          // overflow-hidden + min-h-0 so xterm gets a bounded viewport and can
          // scroll scrollback — without this the terminal grows and is clipped.
          expanded ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "hidden",
          dragging && "pointer-events-none",
        )}
      >
        {renderConsole(expanded && !dragging)}
      </div>
    </div>
  );
}
