"use client";

import { KanbanBoard } from "@eva/ui";
import { useCallback, type ReactNode, type RefCallback } from "react";

import type { IconCircle } from "@tabler/icons-react";
import { TASK_STATUSES } from "@/lib/components/tasks/TaskStatusBadge";

export { TASK_STATUSES as KANBAN_STATUSES };

/**
 * Width sizing for a kanban column wrapper. Each breakpoint fixes how many
 * columns fit on screen — 1 on mobile (with a peek of the next one to signal
 * the scroll), 2 on tablet, 3 on small desktops, 4 on large ones, 5 on the
 * widest. The basis subtracts the `gap-3` gutters between those columns, so an
 * n-column step subtracts (n-1) × 0.75rem. Columns never shrink, so
 * extra statuses push the board into a horizontal scroll rather than squishing
 * every column; boards with fewer columns than the breakpoint allows still grow
 * to fill the width.
 */
export const KANBAN_COLUMN_WIDTH_CLASS =
  "min-w-[70vw] flex-1 sm:min-w-0 sm:flex-[1_0_calc((100%-0.75rem)/2)] lg:flex-[1_0_calc((100%-1.5rem)/3)] xl:flex-[1_0_calc((100%-2.25rem)/4)] 2xl:flex-[1_0_calc((100%-3rem)/5)]";

interface ColumnConfig {
  /** Kept for callers; the column header is neutral, only the glyph is tinted. */
  bg?: string;
  /** Kept for callers; columns use a flat muted wash + hairline border. */
  cardBg?: string;
  text: string;
  label: string;
  icon: typeof IconCircle;
}

interface KanbanColumnProps {
  id: string;
  config: ColumnConfig;
  count: number;
  children: ReactNode;
  droppable?: boolean;
  headerExtra?: ReactNode;
  emptyLabel?: string;
  scrollRef?: RefCallback<HTMLDivElement>;
}

export function KanbanColumn({
  id,
  config,
  count,
  children,
  droppable = true,
  headerExtra,
  emptyLabel = "No items",
  scrollRef,
}: KanbanColumnProps) {
  const Icon = config.icon;

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef?.(node);
    },
    [scrollRef],
  );

  return (
    <KanbanBoard
      id={id}
      disabled={!droppable}
      className="flex min-h-0 min-w-0 flex-1 self-stretch flex-col overflow-clip bg-muted"
    >
      {/* Column header: the status icon is the only tinted element — the label
          and count stay neutral so a five-column board reads as one surface. */}
      <div className="flex h-9 flex-shrink-0 flex-row items-center justify-between gap-2 px-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <Icon size={13} className={config.text} />
          <span className="truncate text-2sm font-medium text-foreground">
            {config.label}
          </span>
          <span className="tabular-nums text-2xs text-muted-foreground">
            {count}
          </span>
        </div>
        {headerExtra}
      </div>
      <div
        ref={ref}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain p-1.5 pt-0 scrollbar scroll-fade md:p-1.5 md:pt-0"
      >
        {count === 0 ? (
          <div className="m-1 flex flex-1 items-center justify-center rounded-surface border border-dashed border-border px-3 py-8 text-xs text-muted-foreground/60">
            {emptyLabel}
          </div>
        ) : null}
        {children}
      </div>
    </KanbanBoard>
  );
}
