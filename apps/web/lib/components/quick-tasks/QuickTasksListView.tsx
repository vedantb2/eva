"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useQueryStates } from "nuqs";
import { searchParser, statusesParser } from "@/lib/search-params";
import {
  Button,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  Spinner,
} from "@conductor/ui";
import {
  IconChevronRight,
  IconFilter,
  IconPlayerPlay,
} from "@tabler/icons-react";
import {
  statusConfig,
  TASK_STATUSES,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { QuickTaskCard } from "./QuickTaskCard";
import { FixAllDialog } from "./FixAllDialog";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import { getWorkflowTokens } from "@/app/(main)/[repo]/actions";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

interface QuickTasksListViewProps {
  repoId: Id<"githubRepos">;
  isSelecting: boolean;
  selectedIds: Set<Id<"agentTasks">>;
  onToggleSelect: (id: Id<"agentTasks">) => void;
}

export function QuickTasksListView({
  repoId,
  isSelecting,
  selectedIds,
  onToggleSelect,
}: QuickTasksListViewProps) {
  const allTasks = useQuery(api.agentTasks.getAllTasks, { repoId });
  const currentUserId = useQuery(api.auth.me);
  const startExecution = useMutation(api.agentTasks.startExecution);
  const triggerExecution = useMutation(api.taskWorkflow.triggerExecution);

  const [selectedTaskId, setSelectedTaskId] = useState<Id<"agentTasks"> | null>(
    null,
  );
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<TaskStatus>>(
    () => new Set(TASK_STATUSES),
  );

  const [{ q, statuses }, setParams] = useQueryStates({
    q: searchParser,
    statuses: statusesParser,
  });
  const searchQuery = q;
  const visibleStatuses = useMemo(
    () => new Set(statuses as TaskStatus[]),
    [statuses],
  );

  const tasks = useMemo(
    () =>
      (allTasks?.filter((t) => !t.projectId) ?? []).sort(
        (a, b) => b.updatedAt - a.updatedAt,
      ),
    [allTasks],
  );

  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query),
    );
  }, [tasks, searchQuery]);

  const tasksByStatus = useMemo(() => {
    return TASK_STATUSES.reduce(
      (acc, status) => {
        acc[status] = filteredTasks.filter((t) => t.status === status);
        return acc;
      },
      {} as Record<TaskStatus, Task[]>,
    );
  }, [filteredTasks]);

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const ownedTodoTasks = todoTasks.filter((t) => t.createdBy === currentUserId);
  const skippedCount = todoTasks.length - ownedTodoTasks.length;

  const handleStatusToggle = (status: TaskStatus) => {
    const next = new Set(visibleStatuses);
    if (next.has(status)) {
      if (next.size === 1) return;
      next.delete(status);
    } else {
      next.add(status);
    }
    setParams({ statuses: [...next] });
  };

  const toggleSection = (status: TaskStatus) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

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

  if (allTasks === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 min-h-0 flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="motion-press hover:scale-[1.01] active:scale-[0.99]"
              >
                <IconFilter size={16} />
                {visibleStatuses.size === TASK_STATUSES.length
                  ? "All Statuses"
                  : `${visibleStatuses.size} Statuses`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {TASK_STATUSES.map((s) => {
                const cfg = statusConfig[s];
                return (
                  <DropdownMenuCheckboxItem
                    key={s}
                    checked={visibleStatuses.has(s)}
                    onCheckedChange={() => handleStatusToggle(s)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <cfg.icon size={16} className={cfg.text + " mr-2"} />
                    <span className={cfg.text}>{cfg.label}</span>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar space-y-1">
          {TASK_STATUSES.filter((status) => visibleStatuses.has(status)).map(
            (status) => {
              const cfg = statusConfig[status];
              const items = tasksByStatus[status] ?? [];
              const Icon = cfg.icon;

              return (
                <Collapsible
                  key={status}
                  open={openSections.has(status)}
                  onOpenChange={() => toggleSection(status)}
                >
                  <div className="flex items-center sticky top-0 z-10 bg-background">
                    <CollapsibleTrigger asChild>
                      <button className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50">
                        <IconChevronRight
                          size={14}
                          className={`text-muted-foreground transition-transform duration-200 ${
                            openSections.has(status) ? "rotate-90" : ""
                          }`}
                        />
                        <Icon size={14} className={cfg.text} />
                        <span className={`text-sm font-medium ${cfg.text}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-muted-foreground/60 tabular-nums">
                          {items.length}
                        </span>
                      </button>
                    </CollapsibleTrigger>
                    {status === "todo" && todoTasks.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => setIsConfirmOpen(true)}
                        disabled={isFixingAll}
                        className="mr-2"
                      >
                        {isFixingAll ? (
                          <Spinner size="sm" />
                        ) : (
                          <IconPlayerPlay size={14} />
                        )}
                        Fix All
                      </Button>
                    )}
                  </div>
                  <CollapsibleContent>
                    {items.length === 0 ? (
                      <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                        No tasks
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 px-1.5 pb-1.5">
                        {items.map((task) => (
                          <QuickTaskCard
                            key={task._id}
                            id={task._id}
                            title={task.title}
                            description={task.description}
                            status={task.status}
                            createdAt={task.createdAt}
                            createdBy={task.createdBy}
                            onClick={() => {
                              if (isSelecting) {
                                onToggleSelect(task._id);
                              } else {
                                setSelectedTaskId(task._id);
                              }
                            }}
                            isSelecting={isSelecting}
                            isSelected={selectedIds.has(task._id)}
                            onToggleSelect={() => onToggleSelect(task._id)}
                          />
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            },
          )}
        </div>
      </div>
      <FixAllDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        ownedCount={ownedTodoTasks.length}
        skippedCount={skippedCount}
        onConfirm={handleFixAll}
        isLoading={isFixingAll}
      />
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
