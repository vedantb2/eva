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
import { useMutation } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { AgentColumn } from "./AgentColumn";
import { AgentTaskCard } from "./AgentTaskCard";
import { useState } from "react";

type AgentStatus = "idle" | "queued" | "running" | "reviewing" | "completed" | "failed";

interface AgentTask {
  _id: Id<"agentTasks">;
  boardId: Id<"boards">;
  columnId: Id<"columns">;
  title: string;
  description?: string;
  status: AgentStatus;
  order: number;
}

interface Column {
  _id: Id<"columns">;
  boardId: Id<"boards">;
  name: string;
  order: number;
  isRunColumn?: boolean;
  tasks: AgentTask[];
}

interface AgentKanbanBoardProps {
  columns: Column[];
}

export function AgentKanbanBoard({ columns }: AgentKanbanBoardProps) {
  const moveToColumn = useMutation(api.agentTasks.moveToColumn);
  const updateOrder = useMutation(api.agentTasks.updateOrder);

  const [activeTask, setActiveTask] = useState<AgentTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const allTasks = columns.flatMap((col) => col.tasks);

  const handleDragStart = (event: DragStartEvent) => {
    const task = allTasks.find((t) => t._id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as Id<"agentTasks">;
    const overId = over.id as string;

    const activeTaskData = allTasks.find((t) => t._id === activeId);
    if (!activeTaskData) return;
    if (activeTaskData.status === "queued" || activeTaskData.status === "running") {
      return;
    }

    const isOverColumn = columns.some((c) => c._id === overId);
    if (isOverColumn) {
      const targetColumnId = overId as Id<"columns">;
      if (activeTaskData.columnId !== targetColumnId) {
        await moveToColumn({ id: activeId, columnId: targetColumnId });
      }
      return;
    }

    const overTaskData = allTasks.find((t) => t._id === overId);
    if (!overTaskData) return;

    if (activeTaskData.columnId !== overTaskData.columnId) {
      await moveToColumn({ id: activeId, columnId: overTaskData.columnId });
    } else if (activeTaskData.order !== overTaskData.order) {
      await updateOrder({ id: activeId, order: overTaskData.order });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[calc(100vh-200px)]">
        {columns.map((column) => (
          <AgentColumn key={column._id} column={column} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <AgentTaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
