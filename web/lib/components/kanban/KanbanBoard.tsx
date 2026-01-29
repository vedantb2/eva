"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useState, useMemo, ReactNode } from "react";
import { KanbanColumn, KANBAN_STATUSES, TASK_STATUS_CONFIG } from "./KanbanColumn";
import { Card, CardBody } from "@heroui/card";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { IconFilter, IconSearch } from "@tabler/icons-react";

type TaskStatus = "todo" | "in_progress" | "business_review" | "code_review" | "done";

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
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleStatuses, setVisibleStatuses] = useState<Set<TaskStatus>>(
    new Set(KANBAN_STATUSES)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const itemsByStatus = useMemo(() => {
    return KANBAN_STATUSES.reduce((acc, status) => {
      acc[status] = filteredItems.filter((item) => item.status === status);
      return acc;
    }, {} as Record<TaskStatus, T[]>);
  }, [filteredItems]);

  const handleStatusToggle = (keys: Set<string>) => {
    const newStatuses = new Set(Array.from(keys) as TaskStatus[]);
    if (newStatuses.size === 0) return;
    setVisibleStatuses(newStatuses);
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
    <div className={fillHeight ? "flex flex-col flex-1 min-h-0 gap-4" : "space-y-4"}>
      <div className="flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              size="sm"
              startContent={<IconFilter size={16} />}
            >
              {visibleStatuses.size === KANBAN_STATUSES.length
                ? "All Columns"
                : `${visibleStatuses.size} Columns`}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Toggle columns"
            selectionMode="multiple"
            selectedKeys={visibleStatuses}
            onSelectionChange={(keys) =>
              handleStatusToggle(keys as Set<string>)
            }
            closeOnSelect={false}
          >
            <DropdownItem key="todo">To Do</DropdownItem>
            <DropdownItem key="in_progress">In Progress</DropdownItem>
            <DropdownItem key="business_review">Business Review</DropdownItem>
            <DropdownItem key="code_review">Code Review</DropdownItem>
            <DropdownItem key="done">Done</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <Input
          placeholder="Search tasks..."
          size="sm"
          className="w-1/2 mx-auto"
          startContent={<IconSearch size={16} className="text-default-400" />}
          value={searchQuery}
          onValueChange={setSearchQuery}
          isClearable
          onClear={() => setSearchQuery("")}
        />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className={`flex items-stretch gap-2 w-full ${fillHeight ? "flex-1 min-h-0" : ""}`}
        >
          {KANBAN_STATUSES.filter((status) => visibleStatuses.has(status)).map(
            (status) => (
              <KanbanColumn
                key={status}
                id={status}
                config={TASK_STATUS_CONFIG[status]}
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
            )
          )}
        </div>
        <DragOverlay>
          {activeItem ? renderOverlay(activeItem) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
