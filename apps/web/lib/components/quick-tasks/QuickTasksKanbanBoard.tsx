"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { KanbanBoard } from "@/lib/components/kanban/KanbanBoard";
import { QuickTaskCard } from "./QuickTaskCard";
import { FixAllDialog } from "./FixAllDialog";
import { Button, Spinner } from "@conductor/ui";
import { IconPlayerPlay } from "@tabler/icons-react";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];
type TaskStatus = Task["status"];

interface QuickTasksKanbanBoardProps {
  repoId: Id<"githubRepos">;
  isSelecting: boolean;
  selectedIds: Set<Id<"agentTasks">>;
  onToggleSelect: (id: Id<"agentTasks">) => void;
  onOpenTask: (id: Id<"agentTasks">) => void;
}

export function QuickTasksKanbanBoard({
  repoId,
  isSelecting,
  selectedIds,
  onToggleSelect,
  onOpenTask,
}: QuickTasksKanbanBoardProps) {
  const allTasks = useQuery(api.agentTasks.getAllTasks, { repoId });
  const currentUserId = useQuery(api.auth.me);
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const startExecution = useMutation(api.agentTasks.startExecution);
  const triggerExecution = useMutation(api.taskWorkflow.triggerExecution);
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const tasks = (allTasks?.filter((t) => !t.projectId) ?? []).sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );

  if (allTasks === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
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
  const ownedTodoTasks = todoTasks.filter((t) => t.createdBy === currentUserId);
  const skippedCount = todoTasks.length - ownedTodoTasks.length;

  const handleFixAll = async () => {
    if (ownedTodoTasks.length === 0) return;
    setIsFixingAll(true);
    try {
      for (const task of ownedTodoTasks) {
        const result = await startExecution({ id: task._id });
        await triggerExecution({
          runId: result.runId,
          taskId: result.taskId,
          repoId: result.repoId,
          installationId: result.installationId,
          projectId: result.projectId,
          branchName: result.branchName,
          baseBranch: result.baseBranch,
          isFirstTaskOnBranch: result.isFirstTaskOnBranch,
          model: result.model,
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
        onItemClick={(task) => {
          if (isSelecting) {
            onToggleSelect(task._id);
          } else {
            onOpenTask(task._id);
          }
        }}
        fillHeight
        columnExtra={(status) =>
          status === "todo" && todoTasks.length > 0 ? (
            <Button
              size="sm"
              onClick={() => setIsConfirmOpen(true)}
              disabled={isFixingAll}
            >
              {isFixingAll ? (
                <Spinner size="sm" />
              ) : (
                <IconPlayerPlay size={14} />
              )}
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
            scheduledAt={task.scheduledAt}
            tags={task.tags}
            createdBy={task.createdBy}
            createdAt={task.createdAt}
            isSelecting={isSelecting}
            isSelected={selectedIds.has(task._id)}
            onToggleSelect={() => onToggleSelect(task._id)}
          />
        )}
        renderOverlay={(task) => (
          <QuickTaskCard
            id={task._id}
            title={task.title}
            description={task.description}
            status={task.status}
            scheduledAt={task.scheduledAt}
            tags={task.tags}
            createdBy={task.createdBy}
            createdAt={task.createdAt}
            isSelecting={isSelecting}
            isSelected={selectedIds.has(task._id)}
          />
        )}
      />
      <FixAllDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        ownedCount={ownedTodoTasks.length}
        skippedCount={skippedCount}
        onConfirm={handleFixAll}
        isLoading={isFixingAll}
      />
    </>
  );
}
