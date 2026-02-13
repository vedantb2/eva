"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { useState, useMemo, ReactNode } from "react";
import { useQueryStates } from "nuqs";
import { searchParser, statusesParser } from "@/lib/search-params";
import { KanbanColumn, KANBAN_STATUSES } from "./KanbanColumn";
import {
  statusConfig,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Button,
  Input,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@conductor/ui";
import { IconFilter, IconSearch, IconX } from "@tabler/icons-react";

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
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab ${isDragging ? "opacity-50" : ""}`}
      {...attributes}
      {...listeners}
      onClick={() => onItemClick(item)}
    >
      {renderCard(item)}
    </div>
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
  const [{ q, statuses }, setParams] = useQueryStates({
    q: searchParser,
    statuses: statusesParser,
  });
  const searchQuery = q;
  const visibleStatuses = useMemo(
    () => new Set(statuses as TaskStatus[]),
    [statuses],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

  const handleStatusToggle = (status: TaskStatus) => {
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
    if (item) setActiveItem(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItemData = items.find((i) => i._id === activeId);
    if (!activeItemData) return;

    const isOverStatus = KANBAN_STATUSES.includes(overId as TaskStatus);
    if (isOverStatus) {
      const targetStatus = overId as TaskStatus;
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

  return (
    <div
      className={
        fillHeight ? "flex flex-col flex-1 min-h-0 gap-1.5" : "space-y-2.5"
      }
    >
      <div className="flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <IconFilter size={16} />
              {visibleStatuses.size === KANBAN_STATUSES.length
                ? "All Columns"
                : `${visibleStatuses.size} Columns`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {KANBAN_STATUSES.map((s) => {
              const cfg = statusConfig[s];
              return (
                <DropdownMenuCheckboxItem
                  key={s}
                  checked={visibleStatuses.has(s)}
                  onCheckedChange={() => handleStatusToggle(s)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <cfg.icon size={16} className={cfg.text + " mr-2"} />
                  <span className={cfg.text}>{cfg.label}</span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="relative mx-auto w-1/2">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search tasks..."
            className="h-8 pl-9 pr-8 text-sm"
            value={searchQuery}
            onChange={(e) => setParams({ q: e.target.value || null })}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setParams({ q: null })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 rounded-sm"
            >
              <IconX size={14} />
            </button>
          )}
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className={`flex w-full items-stretch gap-1.5 ${fillHeight ? "min-h-0 flex-1 overflow-hidden" : ""}`}
        >
          {KANBAN_STATUSES.filter((status) => visibleStatuses.has(status)).map(
            (status) => (
              <KanbanColumn
                key={status}
                id={status}
                config={statusConfig[status]}
                count={itemsByStatus[status]?.length ?? 0}
                headerExtra={columnExtra?.(status)}
              >
                <SortableContext
                  items={itemsByStatus[status]?.map((i) => i._id) ?? []}
                  strategy={verticalListSortingStrategy}
                >
                  {itemsByStatus[status]?.map((item) => (
                    <SortableItem
                      key={item._id}
                      item={item}
                      renderCard={renderCard}
                      onItemClick={onItemClick}
                    />
                  ))}
                </SortableContext>
              </KanbanColumn>
            ),
          )}
        </div>
        <DragOverlay>
          {activeItem ? renderOverlay(activeItem) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
