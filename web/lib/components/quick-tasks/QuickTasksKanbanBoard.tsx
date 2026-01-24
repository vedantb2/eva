"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useState } from "react";
import { KanbanBoard } from "@/lib/components/kanban/KanbanBoard";
import { QuickTaskCard } from "./QuickTaskCard";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import { Card, CardBody } from "@heroui/card";

type TaskStatus = "todo" | "in_progress" | "code_review" | "done";

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

export function QuickTasksKanbanBoard({ repoId }: QuickTasksKanbanBoardProps) {
  const allTasks = useQuery(api.agentTasks.getAllTasks, { repoId });
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const tasks = allTasks?.filter((t) => !t.projectId) ?? [];

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

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await updateStatus({ id: id as Id<"agentTasks">, status });
  };

  return (
    <>
      <KanbanBoard
        items={tasks}
        onStatusChange={handleStatusChange}
        onItemClick={setSelectedTask}
        fillHeight
        renderCard={(task) => (
          <QuickTaskCard
            id={task._id}
            title={task.title}
            description={task.description}
            status={task.status}
          />
        )}
        renderOverlay={(task) => (
          <Card shadow="none" className="w-[240px] sm:w-[280px]">
            <CardBody className="p-3">
              <span className="font-medium text-sm">{task.title}</span>
            </CardBody>
          </Card>
        )}
      />
      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          taskId={selectedTask._id}
          title={selectedTask.title}
          description={selectedTask.description}
          status={selectedTask.status}
        />
      )}
    </>
  );
}
