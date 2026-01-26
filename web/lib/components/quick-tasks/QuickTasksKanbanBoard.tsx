"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useState } from "react";
import { KanbanBoard } from "@/lib/components/kanban/KanbanBoard";
import { QuickTaskCard } from "./QuickTaskCard";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { IconPlayerPlay } from "@tabler/icons-react";

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
  const startExecution = useMutation(api.agentTasks.startExecution);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFixingAll, setIsFixingAll] = useState(false);

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

  const todoTasks = tasks.filter((t) => t.status === "todo");

  const handleFixAll = async () => {
    if (todoTasks.length === 0) return;
    setIsFixingAll(true);
    try {
      for (const task of todoTasks) {
        const result = await startExecution({ id: task._id });
        await fetch("/api/inngest/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "task/execute.requested",
            data: {
              runId: result.runId,
              taskId: result.taskId,
              repoId: result.repoId,
              installationId: result.installationId,
              projectId: result.projectId,
              branchName: result.branchName,
              isFirstTaskOnBranch: result.isFirstTaskOnBranch,
            },
          }),
        });
      }
    } catch (err) {
      console.error("Failed to fix all:", err);
    } finally {
      setIsFixingAll(false);
    }
  };

  return (
    <>
      <KanbanBoard
        items={tasks}
        onStatusChange={handleStatusChange}
        onItemClick={setSelectedTask}
        fillHeight
        columnExtra={(status) =>
          status === "todo" && todoTasks.length > 0 ? (
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<IconPlayerPlay size={14} />}
              onPress={handleFixAll}
              isLoading={isFixingAll}
            >
              Fix All
            </Button>
          ) : null
        }
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
