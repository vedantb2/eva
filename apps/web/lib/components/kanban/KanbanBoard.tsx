"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragCancelEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { useState, useMemo, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQueryStates } from "nuqs";
import { searchParser, statusesParser } from "@/lib/search-params";
import { KanbanColumn, KANBAN_STATUSES } from "./KanbanColumn";
import {
  statusConfig,
  type TaskStatus,
  type DisplayTaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

function SortableItem<T extends BaseTask>({
  item,
  renderCard,
  onItemClick,
}: {
  item: T;
  renderCard: (item: T) => ReactNode;
  onItemClick: (item: T) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      layout
      ref={setNodeRef}
      style={style}
      className={`rounded-lg transition-opacity duration-150 ${isDragging ? "opacity-40 cursor-grabbing" : "cursor-grab"}`}
      {...attributes}
      {...listeners}
      onClick={() => onItemClick(item)}
    >
      {renderCard(item)}
    </motion.div>
  );
}

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
  const [{ q, statuses }, setParams] = useQueryStates({
    q: searchParser,
    statuses: statusesParser,
  });
  const searchQuery = q;
  const visibleStatuses = useMemo(() => new Set(statuses), [statuses]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 10,
      },
    }),
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query),
    );
  }, [items, searchQuery]);

  const itemsByStatus = useMemo(() => {
    return KANBAN_STATUSES.reduce(
      (acc, status) => {
        acc[status] = filteredItems.filter((item) => item.status === status);
        return acc;
      },
      {} as Record<TaskStatus, T[]>,
    );
  }, [filteredItems]);

  const handleStatusToggle = (status: DisplayTaskStatus) => {
    const next = new Set(visibleStatuses);
    if (next.has(status)) {
      if (next.size === 1) return;
      next.delete(status);
    } else {
      next.add(status);
    }
    setParams({ statuses: [...next] });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = items.find((i) => i._id === event.active.id);
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

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItemData = items.find((i) => i._id === activeId);
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

    const overItemData = items.find((i) => i._id === overId);
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
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
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
                  count={itemsByStatus[status]?.length ?? 0}
                  headerExtra={columnExtra?.(status)}
                >
                  <SortableContext
                    items={itemsByStatus[status]?.map((i) => i._id) ?? []}
                    strategy={verticalListSortingStrategy}
                  >
                    <AnimatePresence initial={false}>
                      {itemsByStatus[status]?.map((item) => (
                        <SortableItem
                          key={item._id}
                          item={item}
                          renderCard={renderCard}
                          onItemClick={onItemClick}
                        />
                      ))}
                    </AnimatePresence>
                  </SortableContext>
                </KanbanColumn>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <DragOverlay>
          {activeItem ? (
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
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
