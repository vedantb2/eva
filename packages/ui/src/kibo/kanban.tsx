"use client";

import type {
  Announcements,
  CollisionDetection,
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";
import { SURFACE_RADIUS_CLASS } from "../utils/surface-radius";
import { resolveOverColumnId } from "./kanbanDropTarget";

export type KanbanItem = {
  id: string;
  name: string;
  column: string;
};

export type KanbanColumnDef = {
  id: string;
  name: string;
};

type KanbanContextValue = {
  columns: KanbanColumnDef[];
  data: KanbanItem[];
  activeCardId: string | null;
  /**
   * Column the dragged card would land in. Distinct from a column's own
   * `isOver`: pointing at a card resolves `over` to that card, so the column
   * under the pointer never reports `isOver` once it holds any cards.
   */
  overColumnId: string | null;
};

const KanbanContext = createContext<KanbanContextValue>({
  columns: [],
  data: [],
  activeCardId: null,
  overColumnId: null,
});

export const useKanbanContext = () => useContext(KanbanContext);

// --- KanbanBoard: droppable column zone ---

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
};

export const KanbanBoard = ({
  id,
  children,
  className,
  disabled = false,
}: KanbanBoardProps) => {
  const { isOver, setNodeRef } = useDroppable({ id, disabled });
  const { overColumnId } = useKanbanContext();
  const isDropTarget = !disabled && (isOver || overColumnId === id);

  return (
    <div
      className={cn(
        "flex size-full min-h-40 flex-col overflow-hidden bg-muted/40 text-xs transition-[background-color,border-color]",
        SURFACE_RADIUS_CLASS,
        className,
        // After `className` on purpose: callers set a column background, and
        // tailwind-merge keeps whichever `bg-*` / `border-*` comes last — so
        // the drop highlight has to be the last word or it never shows.
        isDropTarget && "border border-primary/40 bg-primary/10",
      )}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
};

// --- KanbanCard: sortable item wrapper ---

export type KanbanCardProps = {
  id: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export const KanbanCard = ({
  id,
  children,
  className,
  onClick,
}: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({ id });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      style={style}
      {...listeners}
      {...attributes}
      ref={setNodeRef}
      onClick={onClick}
      className={cn(
        "cursor-grab transition-opacity duration-150",
        SURFACE_RADIUS_CLASS,
        isDragging && "pointer-events-none cursor-grabbing opacity-30",
        className,
      )}
    >
      {children}
    </div>
  );
};

// --- KanbanCards: SortableContext + auto-filter by column from context ---

export type KanbanCardsProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "id"
> & {
  children: (item: KanbanItem) => ReactNode;
  id: string;
};

export const KanbanCards = ({
  children,
  className,
  id,
  ...props
}: KanbanCardsProps) => {
  const { data } = useKanbanContext();
  const filteredData = data.filter((item) => item.column === id);
  const itemIds = filteredData.map((item) => item.id);

  return (
    <SortableContext items={itemIds}>
      <div
        className={cn("flex grow flex-col gap-1.5", className)}
        {...props}
      >
        {filteredData.map(children)}
      </div>
    </SortableContext>
  );
};

// --- KanbanHeader: simple styled header ---

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>;

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps) => (
  <div className={cn("m-0 p-2 font-semibold text-sm", className)} {...props} />
);

// --- KanbanProvider: DnD context + Kanban context + a11y ---

export type KanbanProviderProps = {
  children: ReactNode;
  columns: KanbanColumnDef[];
  data: KanbanItem[];
  overlay?: ReactNode;
  className?: string;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragCancel?: (event: DragCancelEvent) => void;
  sensors?: ReturnType<typeof useSensors>;
  collisionDetection?: CollisionDetection;
};

export const KanbanProvider = ({
  children,
  columns,
  data,
  overlay,
  className,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragCancel,
  sensors: sensorsProp,
  collisionDetection = closestCenter,
}: KanbanProviderProps) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const defaultSensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = data.find((item) => item.id === event.active.id);
    if (card) {
      setActiveCardId(String(event.active.id));
    }
    onDragStart?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over ? String(event.over.id) : null;
    setOverColumnId(resolveOverColumnId(overId, columns, data));
    onDragOver?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    setOverColumnId(null);
    onDragEnd?.(event);
  };

  const handleDragCancel = (event: DragCancelEvent) => {
    setActiveCardId(null);
    setOverColumnId(null);
    onDragCancel?.(event);
  };

  const announcements: Announcements = {
    onDragStart({ active }) {
      const item = data.find((d) => d.id === active.id);
      const col = columns.find((c) => c.id === item?.column);
      return `Picked up card "${item?.name}" from "${col?.name}" column`;
    },
    onDragOver({ active, over }) {
      const item = data.find((d) => d.id === active.id);
      const col = columns.find((c) => c.id === over?.id);
      return `Dragged card "${item?.name}" over "${col?.name}" column`;
    },
    onDragEnd({ active, over }) {
      const item = data.find((d) => d.id === active.id);
      const col = columns.find((c) => c.id === over?.id);
      return `Dropped card "${item?.name}" into "${col?.name}" column`;
    },
    onDragCancel({ active }) {
      const item = data.find((d) => d.id === active.id);
      return `Cancelled dragging card "${item?.name}"`;
    },
  };

  return (
    <KanbanContext.Provider
      value={{ columns, data, activeCardId, overColumnId }}
    >
      <DndContext
        accessibility={{ announcements }}
        collisionDetection={collisionDetection}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        sensors={sensorsProp ?? defaultSensors}
      >
        {className ? <div className={className}>{children}</div> : children}
        {typeof window !== "undefined" &&
          createPortal(<DragOverlay>{overlay}</DragOverlay>, document.body)}
      </DndContext>
    </KanbanContext.Provider>
  );
};
