"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { KanbanBoard } from "@/lib/components/kanban/KanbanBoard";
import { QuickTaskCard } from "./QuickTaskCard";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Spinner,
} from "@conductor/ui";
import { IconPlayerPlay } from "@tabler/icons-react";
import { getWorkflowTokens } from "@/app/(main)/[repo]/actions";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];
type TaskStatus = Task["status"];

interface QuickTasksKanbanBoardProps {
  repoId: Id<"githubRepos">;
  isSelecting: boolean;
  selectedIds: Set<Id<"agentTasks">>;
  onToggleSelect: (id: Id<"agentTasks">) => void;
}

export function QuickTasksKanbanBoard({
  repoId,
  isSelecting,
  selectedIds,
  onToggleSelect,
}: QuickTasksKanbanBoardProps) {
  const allTasks = useQuery(api.agentTasks.getAllTasks, { repoId });
  const currentUserId = useQuery(api.auth.me);
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const startExecution = useMutation(api.agentTasks.startExecution);
  const triggerExecution = useMutation(api.taskWorkflow.triggerExecution);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"agentTasks"> | null>(
    null,
  );
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
        const { githubToken, convexToken } = await getWorkflowTokens(
          result.installationId,
        );
        await triggerExecution({
          runId: result.runId,
          taskId: result.taskId,
          repoId: result.repoId,
          installationId: result.installationId,
          projectId: result.projectId,
          branchName: result.branchName,
          isFirstTaskOnBranch: result.isFirstTaskOnBranch,
          model: result.model,
          convexToken,
          githubToken,
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
            setSelectedTaskId(task._id);
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
            createdAt={task.createdAt}
            createdBy={task.createdBy}
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
            createdAt={task.createdAt}
            createdBy={task.createdBy}
            isSelecting={isSelecting}
            isSelected={selectedIds.has(task._id)}
          />
        )}
      />
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete All Tasks</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            {ownedTodoTasks.length > 0 ? (
              <>
                <p>
                  Eva will run and complete {ownedTodoTasks.length} task
                  {ownedTodoTasks.length !== 1 && "s"} you created.
                </p>
                {skippedCount > 0 && (
                  <p className="text-warning">
                    {skippedCount} task{skippedCount !== 1 && "s"} created by
                    others will be skipped. Only the task owner can run Eva.
                  </p>
                )}
                <p>
                  If there is an issue, Eva will return the task to To Do with a
                  red border.
                </p>
                <p>If successful, she will move it to Code Review.</p>
              </>
            ) : (
              <p>
                Only the task owner can run Eva. None of the todo tasks were
                created by you.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={ownedTodoTasks.length === 0}
              onClick={() => {
                setIsConfirmOpen(false);
                handleFixAll();
              }}
            >
              Complete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selectedTaskId && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          taskId={selectedTaskId}
        />
      )}
    </>
  );
}
