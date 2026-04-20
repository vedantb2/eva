"use client";

import type { ReactNode, RefCallback } from "react";
import { useState, useMemo, useCallback } from "react";
import {
  type DragEndEvent,
  type DragStartEvent,
  type DragCancelEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "motion/react";
import { useQueryStates } from "nuqs";
import { Virtuoso } from "react-virtuoso";
import {
  KanbanProvider,
  KanbanCard,
  type KanbanItem,
  type KanbanColumnDef,
} from "@conductor/ui";
import { searchParser, statusesParser } from "@/lib/search-params";
import { KanbanColumn, KANBAN_STATUSES } from "./KanbanColumn";
import { KanbanCarousel } from "./KanbanCarousel";
import {
  statusConfig,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";

interface BaseTask {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
}

interface KanbanBoardProps<T extends BaseTask> {
  items: T[];
  onStatusChange: (id: string, status: TaskStatus) => Promise<void>;
  renderCard: (item: T) => ReactNode;
  renderOverlay: (item: T) => ReactNode;
  onItemClick: (item: T) => void;
  fillHeight?: boolean;
  columnExtra?: (status: TaskStatus) => ReactNode;
}

const COLUMNS: KanbanColumnDef[] = KANBAN_STATUSES.map((status) => ({
  id: status,
  name: statusConfig[status].label,
}));

export function KanbanBoard<T extends BaseTask>({
  items,
  onStatusChange,
  renderCard,
  renderOverlay,
  onItemClick,
  fillHeight = false,
  columnExtra,
}: KanbanBoardProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);
  const [activeOverlayWidth, setActiveOverlayWidth] = useState<number | null>(
    null,
  );
  const [{ q, statuses }] = useQueryStates({
    q: searchParser,
    statuses: statusesParser,
  });
  const visibleStatuses = useMemo(() => new Set(statuses), [statuses]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 10,
      },
    }),
  );

  const itemsById = useMemo(() => {
    const map = new Map<string, T>();
    for (const item of items) {
      map.set(item._id, item);
    }
    return map;
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = q.toLowerCase().trim();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query),
    );
  }, [items, q]);

  const kanbanData: KanbanItem[] = useMemo(
    () =>
      filteredItems.map((item) => ({
        id: item._id,
        name: item.title,
        column: item.status,
      })),
    [filteredItems],
  );

  const itemsByStatus = useMemo(() => {
    const map = new Map<string, T[]>();
    for (const status of KANBAN_STATUSES) {
      map.set(status, []);
    }
    for (const item of filteredItems) {
      map.get(item.status)?.push(item);
    }
    return map;
  }, [filteredItems]);

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const status of KANBAN_STATUSES) {
      counts[status] = itemsByStatus.get(status)?.length ?? 0;
    }
    return counts;
  }, [itemsByStatus]);

  const handleDragStart = (event: DragStartEvent) => {
    const item = itemsById.get(String(event.active.id));
    if (item) {
      setActiveItem(item);
      const width =
        event.active.rect.current.initial?.width ??
        event.active.rect.current.translated?.width;
      setActiveOverlayWidth(width ? Math.round(width) : null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);
    setActiveOverlayWidth(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeItemData = itemsById.get(activeId);
    if (!activeItemData) return;

    const targetStatus = KANBAN_STATUSES.find((s) => s === overId);
    if (targetStatus) {
      if (activeItemData.status !== targetStatus) {
        try {
          await onStatusChange(activeId, targetStatus);
        } catch (err) {
          console.error("Failed to update status:", err);
        }
      }
      return;
    }

    const overItemData = itemsById.get(overId);
    if (overItemData && activeItemData.status !== overItemData.status) {
      try {
        await onStatusChange(activeId, overItemData.status);
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    }
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveItem(null);
    setActiveOverlayWidth(null);
  };

  return (
    <div
      className={
        fillHeight
          ? "flex min-w-0 flex-1 min-h-0 flex-col gap-3 animate-in fade-in duration-300"
          : "space-y-3 animate-in fade-in duration-300"
      }
    >
      <KanbanProvider
        columns={COLUMNS}
        data={kanbanData}
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        overlay={
          activeItem ? (
            <div
              className="pointer-events-none rotate-[1.5deg]"
              style={
                activeOverlayWidth
                  ? { width: `${activeOverlayWidth}px` }
                  : undefined
              }
            >
              {renderOverlay(activeItem)}
            </div>
          ) : null
        }
      >
        <KanbanCarousel
          items={KANBAN_STATUSES.filter((status) =>
            visibleStatuses.has(status),
          )}
          getKey={(status) => status}
          fillHeight={fillHeight}
          renderColumn={(status) => (
            <VirtualKanbanColumn
              status={status}
              items={itemsByStatus.get(status) ?? []}
              count={countByStatus[status] ?? 0}
              headerExtra={columnExtra?.(status)}
              renderCard={renderCard}
              onItemClick={onItemClick}
            />
          )}
        />
      </KanbanProvider>
    </div>
  );
}

function VirtualKanbanColumn<T extends BaseTask>({
  status,
  items,
  count,
  headerExtra,
  renderCard,
  onItemClick,
}: {
  status: string;
  items: T[];
  count: number;
  headerExtra?: ReactNode;
  renderCard: (item: T) => ReactNode;
  onItemClick: (item: T) => void;
}) {
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);

  const scrollRef: RefCallback<HTMLDivElement> = useCallback(
    (node: HTMLDivElement | null) => {
      setScrollParent(node);
    },
    [],
  );

  const itemIds = useMemo(() => items.map((item) => item._id), [items]);

  return (
    <KanbanColumn
      id={status}
      config={statusConfig[status as TaskStatus]}
      count={count}
      headerExtra={headerExtra}
      scrollRef={scrollRef}
    >
      <SortableContext items={itemIds}>
        {scrollParent && (
          <Virtuoso
            customScrollParent={scrollParent}
            totalCount={items.length}
            overscan={200}
            itemContent={(index) => {
              const task = items[index];
              return (
                <div className="pb-1.5">
                  <KanbanCard id={task._id} onClick={() => onItemClick(task)}>
                    {renderCard(task)}
                  </KanbanCard>
                </div>
              );
            }}
          />
        )}
      </SortableContext>
    </KanbanColumn>
  );
}
