"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useQueryStates } from "nuqs";
import { searchParser, statusesParser } from "@/lib/search-params";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  Button,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Spinner,
} from "@conductor/ui";
import { IconChevronRight, IconPlayerPlay } from "@tabler/icons-react";
import {
  statusConfig,
  TASK_STATUSES,
  type TaskStatus,
  type DisplayTaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { QuickTaskCard } from "./QuickTaskCard";
import { FixAllDialog } from "./FixAllDialog";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

interface QuickTasksListViewProps {
  tasks: Task[];
  projectNames: Map<string, string>;
  isSelecting: boolean;
  selectedIds: Set<Id<"agentTasks">>;
  onToggleSelect: (id: Id<"agentTasks">) => void;
  onOpenTask: (id: Id<"agentTasks">) => void;
  selectedTaskId?: string | null;
}

export function QuickTasksListView({
  tasks: externalTasks,
  projectNames,
  isSelecting,
  selectedIds,
  onToggleSelect,
  onOpenTask,
  selectedTaskId,
}: QuickTasksListViewProps) {
  const { repoId } = useRepo();
  const currentUserId = useQuery(api.auth.me);
  const siblingApps = useQuery(api.githubRepos.listSiblingApps, { repoId });
  const startExecution = useMutation(api.agentTasks.startExecution);

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
  const visibleStatuses = useMemo(() => new Set(statuses), [statuses]);

  const tasks = useMemo(
    () => [...externalTasks].sort((a, b) => b.createdAt - a.createdAt),
    [externalTasks],
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

  const handleStatusToggle = (status: DisplayTaskStatus) => {
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
      <div className="flex flex-1 min-h-0 flex-col gap-2 sm:gap-3">
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar space-y-1 pb-2">
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
                  <div className="flex items-center sticky top-0 z-10 bg-background pb-1.5 pt-0.5">
                    <CollapsibleTrigger asChild>
                      <button className="flex flex-1 items-center gap-2 rounded-lg px-2 py-3 sm:px-3 sm:py-2 text-left transition-colors hover:bg-muted/50 min-h-[44px]">
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
                        className="mr-2 min-h-[36px]"
                      >
                        {isFixingAll ? (
                          <Spinner size="sm" />
                        ) : (
                          <IconPlayerPlay size={14} />
                        )}
                        <span className="hidden sm:inline">Fix All</span>
                        <span className="sm:hidden">Fix</span>
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
                            scheduledAt={task.scheduledAt}
                            tags={task.tags}
                            createdBy={task.createdBy}
                            createdAt={task.createdAt}
                            projectName={
                              task.projectId
                                ? projectNames.get(task.projectId)
                                : undefined
                            }
                            onClick={() => {
                              if (isSelecting) {
                                onToggleSelect(task._id);
                              } else {
                                onOpenTask(task._id);
                              }
                            }}
                            isSelecting={isSelecting}
                            isSelected={selectedIds.has(task._id)}
                            isActive={selectedTaskId === task._id}
                            onToggleSelect={() => onToggleSelect(task._id)}
                            siblingApps={siblingApps ?? undefined}
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
    </>
  );
}
