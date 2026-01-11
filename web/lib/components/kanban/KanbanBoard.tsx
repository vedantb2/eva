"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useMutation } from "convex/react";
import { api } from "../../../../backend/convex/_generated/api";
import { Id } from "../../../../backend/convex/_generated/dataModel";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { useState } from "react";

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  _id: Id<"tasks">;
  projectId: Id<"projects">;
  title: string;
  description?: string;
  status: TaskStatus;
  order: number;
  createdAt: number;
  updatedAt: number;
}

interface KanbanBoardProps {
  projectId: Id<"projects">;
  tasks: Task[];
}

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "Todo" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export function KanbanBoard({ projectId, tasks }: KanbanBoardProps) {
  const updateStatus = useMutation(api.tasks.updateStatus);
  const updateOrder = useMutation(api.tasks.updateOrder);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByStatus = columns.map((col) => ({
    ...col,
    tasks: tasks
      .filter((t) => t.status === col.id)
      .sort((a, b) => a.order - b.order),
  }));

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t._id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (_event: DragOverEvent) => {
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as Id<"tasks">;
    const overId = over.id as string;

    const activeTaskData = tasks.find((t) => t._id === activeId);
    if (!activeTaskData) return;

    const isOverColumn = columns.some((c) => c.id === overId);
    if (isOverColumn) {
      const newStatus = overId as TaskStatus;
      if (activeTaskData.status !== newStatus) {
        await updateStatus({ id: activeId, status: newStatus });
      }
      return;
    }

    const overTaskData = tasks.find((t) => t._id === overId);
    if (!overTaskData) return;

    if (activeTaskData.status !== overTaskData.status) {
      await updateStatus({ id: activeId, status: overTaskData.status });
    } else if (activeTaskData.order !== overTaskData.order) {
      await updateOrder({ id: activeId, order: overTaskData.order });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[calc(100vh-200px)]">
        {tasksByStatus.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={column.tasks}
            projectId={projectId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
