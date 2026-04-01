"use client";

import { useState, useMemo, ReactNode } from "react";
import {
  type DragEndEvent,
  type DragStartEvent,
  type DragCancelEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "motion/react";
import { useQueryStates } from "nuqs";
import {
  KanbanProvider,
  KanbanCards,
  KanbanCard,
  type KanbanItem,
  type KanbanColumnDef,
} from "@conductor/ui";
import { searchParser, statusesParser } from "@/lib/search-params";
import { KanbanColumn, KANBAN_STATUSES } from "./KanbanColumn";
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

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const status of KANBAN_STATUSES) {
      counts[status] = 0;
    }
    for (const item of filteredItems) {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
    }
    return counts;
  }, [filteredItems]);

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
        <div
          className={`flex w-full items-stretch gap-2 pb-1 sm:gap-3 ${
            fillHeight
              ? "min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden scrollbar snap-x snap-mandatory sm:snap-none"
              : ""
          }`}
        >
          <AnimatePresence initial={false}>
            {KANBAN_STATUSES.filter((status) =>
              visibleStatuses.has(status),
            ).map((status) => (
              <motion.div
                key={status}
                layout
                className="flex min-h-0 min-w-[70vw] sm:min-w-0 flex-1 self-stretch snap-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <KanbanColumn
                  id={status}
                  config={statusConfig[status]}
                  count={countByStatus[status] ?? 0}
                  headerExtra={columnExtra?.(status)}
                >
                  <KanbanCards id={status}>
                    {(kanbanItem) => {
                      const task = itemsById.get(kanbanItem.id);
                      if (!task) return null;
                      return (
                        <KanbanCard
                          key={kanbanItem.id}
                          id={kanbanItem.id}
                          onClick={() => onItemClick(task)}
                        >
                          {renderCard(task)}
                        </KanbanCard>
                      );
                    }}
                  </KanbanCards>
                </KanbanColumn>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </KanbanProvider>
    </div>
  );
}
