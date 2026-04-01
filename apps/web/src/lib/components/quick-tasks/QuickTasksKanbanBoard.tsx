"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useMemo, useState } from "react";
import { KanbanBoard } from "@/lib/components/kanban/KanbanBoard";
import { QuickTaskCard } from "./QuickTaskCard";
import { FixAllDialog } from "./FixAllDialog";
import { Button, Spinner } from "@conductor/ui";
import { IconPlayerPlay } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];
type TaskStatus = Task["status"];

interface QuickTasksKanbanBoardProps {
  tasks: Task[];
  projectNames: Map<string, string>;
  isSelecting: boolean;
  selectedIds: Set<Id<"agentTasks">>;
  onToggleSelect: (id: Id<"agentTasks">) => void;
  onOpenTask: (id: Id<"agentTasks">) => void;
}

export function QuickTasksKanbanBoard({
  tasks: externalTasks,
  projectNames,
  isSelecting,
  selectedIds,
  onToggleSelect,
  onOpenTask,
}: QuickTasksKanbanBoardProps) {
  const { repoId } = useRepo();
  const currentUserId = useQuery(api.auth.me);
  const siblingApps = useQuery(api.githubRepos.listSiblingApps, { repoId });
  const users = useQuery(api.users.listAll);
  const projects = useQuery(api.projects.list, { repoId });
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const startExecution = useMutation(api.agentTasks.startExecution);
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const tasks = [...externalTasks].sort((a, b) => b.createdAt - a.createdAt);

  const taskIds = useMemo(() => tasks.map((t) => t._id), [tasks]);
  const errorTaskIds = useQuery(api.agentRuns.getTaskIdsWithLatestRunError, {
    taskIds,
  });
  const errorTaskIdSet = useMemo(
    () => new Set(errorTaskIds ?? []),
    [errorTaskIds],
  );

  if (tasks.length === 0) {
    return null;
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const task = tasks.find((t) => t._id === id);
    if (task) await updateStatus({ id: task._id, status });
  };

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const ownedTodoTasks = todoTasks.filter((t) => t.createdBy === currentUserId);
  const skippedCount = todoTasks.length - ownedTodoTasks.length;

  const handleFixAll = async () => {
    if (ownedTodoTasks.length === 0) return;
    setIsFixingAll(true);
    try {
      const results = await Promise.all(
        ownedTodoTasks.map(async (task) => {
          try {
            await startExecution({ id: task._id });
            return true;
          } catch (err) {
            console.error(`Failed to start task ${task._id}:`, err);
            return false;
          }
        }),
      );
      const failedCount = results.filter((started) => !started).length;
      if (failedCount > 0) {
        console.error(
          `Fix All started ${ownedTodoTasks.length - failedCount} of ${ownedTodoTasks.length} tasks`,
        );
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
            hasError={errorTaskIdSet.has(task._id)}
            scheduledAt={task.scheduledAt}
            tags={task.tags}
            createdByUser={users?.find((u) => u._id === task.createdBy)}
            createdAt={task.createdAt}
            projectName={
              task.projectId ? projectNames.get(task.projectId) : undefined
            }
            siblingApps={siblingApps ?? undefined}
            isSelecting={isSelecting}
            isSelected={selectedIds.has(task._id)}
            onToggleSelect={() => onToggleSelect(task._id)}
            assignedTo={task.assignedTo}
            model={task.model}
            projectId={task.projectId}
            repoId={task.repoId ?? repoId}
            users={users ?? undefined}
            currentUserId={currentUserId ?? undefined}
            projects={projects ?? undefined}
          />
        )}
        renderOverlay={(task) => (
          <QuickTaskCard
            id={task._id}
            title={task.title}
            description={task.description}
            status={task.status}
            hasError={errorTaskIdSet.has(task._id)}
            scheduledAt={task.scheduledAt}
            tags={task.tags}
            createdByUser={users?.find((u) => u._id === task.createdBy)}
            createdAt={task.createdAt}
            projectName={
              task.projectId ? projectNames.get(task.projectId) : undefined
            }
            siblingApps={siblingApps ?? undefined}
            isSelecting={isSelecting}
            isSelected={selectedIds.has(task._id)}
            assignedTo={task.assignedTo}
            model={task.model}
            projectId={task.projectId}
            repoId={task.repoId ?? repoId}
            users={users ?? undefined}
            currentUserId={currentUserId ?? undefined}
            projects={projects ?? undefined}
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
