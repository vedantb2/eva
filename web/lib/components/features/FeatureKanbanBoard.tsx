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
import { FeatureTaskCard } from "./FeatureTaskCard";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import { Card, CardBody } from "@heroui/card";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
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
  taskNumber?: number;
  branchName?: string;
  order: number;
}

interface FeatureKanbanBoardProps {
  featureId: Id<"features">;
}

function SortableTaskCard({
  task,
  onSelect,
}: {
  task: Task;
  onSelect: (task: Task) => void;
}) {
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
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task)}
    >
      <FeatureTaskCard
        id={task._id}
        taskNumber={task.taskNumber ?? 0}
        title={task.title}
        description={task.description}
        status={task.status}
        branchName={task.branchName}
      />
    </div>
  );
}

export function FeatureKanbanBoard({ featureId }: FeatureKanbanBoardProps) {
  const tasks = useQuery(api.agentTasks.listByFeature, { featureId });
  const updateStatus = useMutation(api.agentTasks.updateStatus);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  if (!tasks) {
    return <div>Loading...</div>;
  }

  const tasksByStatus = KANBAN_STATUSES.reduce((acc, status) => {
    acc[status] = tasks
      .filter((t) => t.status === status)
      .sort((a, b) => (a.taskNumber ?? 0) - (b.taskNumber ?? 0));
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
      <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 min-h-[400px] sm:min-h-[500px] h-[calc(100vh-200px)] sm:h-[calc(100vh-180px)]">
        {KANBAN_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            count={tasksByStatus[status]?.length ?? 0}
          >
            <SortableContext
              items={tasksByStatus[status]?.map((t) => t._id) ?? []}
              strategy={verticalListSortingStrategy}
            >
              {tasksByStatus[status]?.map((task) => (
                <SortableTaskCard
                  key={task._id}
                  task={task}
                  onSelect={setSelectedTask}
                />
              ))}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <Card className="w-[240px] sm:w-[280px]">
            <CardBody className="p-3">
              <span className="text-default-400 font-mono text-sm">
                #{activeTask.taskNumber}
              </span>
              <span className="ml-2 font-medium text-sm">
                {activeTask.title}
              </span>
            </CardBody>
          </Card>
        ) : null}
      </DragOverlay>
      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          taskId={selectedTask._id}
          taskNumber={selectedTask.taskNumber}
          title={selectedTask.title}
          description={selectedTask.description}
          status={selectedTask.status}
          branchName={selectedTask.branchName}
        />
      )}
    </DndContext>
  );
}
