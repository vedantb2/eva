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
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useState } from "react";
import {
  KanbanColumn,
  KANBAN_STATUSES,
} from "@/lib/components/kanban/KanbanColumn";
import { QuickTaskCard } from "./QuickTaskCard";
import { Card, CardBody } from "@heroui/card";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type TaskStatus =
  | "archived"
  | "backlog"
  | "todo"
  | "in_progress"
  | "code_review"
  | "done";

interface Task {
  _id: Id<"agentTasks">;
  title: string;
  description?: string;
  status: TaskStatus;
  order: number;
}

interface QuickTasksKanbanBoardProps {
  repoId: Id<"githubRepos">;
}

function SortableTaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <QuickTaskCard
        id={task._id}
        title={task.title}
        description={task.description}
        status={task.status}
      />
    </div>
  );
}

export function QuickTasksKanbanBoard({ repoId }: QuickTasksKanbanBoardProps) {
  const allTasks = useQuery(api.agentTasks.getAllTasks, { repoId });
  const updateStatus = useMutation(api.agentTasks.updateStatus);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasks = allTasks?.filter((t) => !t.featureId) ?? [];

  if (allTasks === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  const tasksByStatus = KANBAN_STATUSES.reduce((acc, status) => {
    acc[status] = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t._id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as Id<"agentTasks">;
    const overId = over.id as string;

    const activeTaskData = tasks.find((t) => t._id === activeId);
    if (!activeTaskData) return;

    const isOverStatus = KANBAN_STATUSES.includes(overId as TaskStatus);
    if (isOverStatus) {
      const targetStatus = overId as TaskStatus;
      if (activeTaskData.status !== targetStatus) {
        try {
          await updateStatus({ id: activeId, status: targetStatus });
        } catch (err) {
          console.error("Failed to update status:", err);
        }
      }
      return;
    }

    const overTaskData = tasks.find((t) => t._id === overId);
    if (overTaskData && activeTaskData.status !== overTaskData.status) {
      try {
        await updateStatus({ id: activeId, status: overTaskData.status });
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-160px)]">
        {KANBAN_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            count={tasksByStatus[status]?.length ?? 0}
          >
            {tasksByStatus[status]?.map((task) => (
              <SortableTaskCard key={task._id} task={task} />
            ))}
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <Card className="w-[280px]">
            <CardBody className="p-3">
              <span className="font-medium text-sm">{activeTask.title}</span>
            </CardBody>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
