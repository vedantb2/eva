"use client";

import { useCallback, useMemo, useState, type RefCallback } from "react";
import { Virtuoso } from "react-virtuoso";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
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
  ListProvider,
  ListGroup,
  ListHeader,
  ListItems,
  ListItem,
  type ListDragEndEvent,
} from "@conductor/ui";
import { IconChevronRight, IconPlayerPlay } from "@tabler/icons-react";
import {
  statusConfig,
  TASK_STATUSES,
  type DisplayTaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { QuickTaskCard } from "./QuickTaskCard";
import { FixAllDialog } from "./FixAllDialog";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

function parseDragEvent(event: ListDragEndEvent) {
  const source = event.active.data.current?.parent;
  if (typeof source !== "string" || !event.over) return null;
  return {
    itemId: String(event.active.id),
    source,
    target: String(event.over.id),
  };
}

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
  const groupedCodebases = useQuery(api.githubRepos.listGroupedByCodebase);
  const users = useQuery(api.users.listAll);
  const projectsList = useQuery(api.projects.list, { repoId });
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const startExecution = useMutation(api.agentTasks.startExecution);

  const taskIds = useMemo(
    () => externalTasks.map((t) => t._id),
    [externalTasks],
  );
  const errorTaskIds = useQuery(api.agentRuns.getTaskIdsWithLatestRunError, {
    repoId,
    taskIds,
  });
  const errorTaskIdSet = useMemo(
    () => new Set(errorTaskIds ?? []),
    [errorTaskIds],
  );

  const [isFixingAll, setIsFixingAll] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<DisplayTaskStatus>>(
    () => new Set(TASK_STATUSES),
  );

  const [{ q, statuses }] = useQueryStates({
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
      {} as Record<DisplayTaskStatus, Task[]>,
    );
  }, [filteredTasks]);

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const ownedTodoTasks = todoTasks.filter((t) => t.createdBy === currentUserId);
  const skippedCount = todoTasks.length - ownedTodoTasks.length;

  const toggleSection = (status: DisplayTaskStatus) => {
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

  const handleDragEnd = useCallback(
    async (event: ListDragEndEvent) => {
      const data = parseDragEvent(event);
      if (!data) return;
      if (data.source === data.target) return;

      const targetStatus = TASK_STATUSES.find((s) => s === data.target);
      if (!targetStatus) return;

      const task = tasks.find((t) => t._id === data.itemId);
      if (!task) return;

      try {
        await updateStatus({ id: task._id, status: targetStatus });
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    },
    [updateStatus, tasks],
  );

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

  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);

  const scrollRef: RefCallback<HTMLDivElement> = useCallback(
    (node: HTMLDivElement | null) => {
      setScrollParent(node);
    },
    [],
  );

  return (
    <>
      <ListProvider
        onDragEnd={handleDragEnd}
        className="flex-1 min-h-0 gap-2 sm:gap-3"
      >
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto scrollbar space-y-1 pb-2"
        >
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
                  <ListGroup id={status}>
                    <ListHeader>
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
                    </ListHeader>
                    <CollapsibleContent>
                      {items.length === 0 ? (
                        <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                          No tasks
                        </div>
                      ) : (
                        <ListItems className="pr-1.5 pb-1.5">
                          {scrollParent && (
                            <Virtuoso
                              customScrollParent={scrollParent}
                              totalCount={items.length}
                              overscan={200}
                              itemContent={(index) => {
                                const task = items[index];
                                return (
                                  <ListItem
                                    id={task._id}
                                    name={task.title}
                                    index={index}
                                    parent={status}
                                  >
                                    <QuickTaskCard
                                      id={task._id}
                                      title={task.title}
                                      description={task.description}
                                      status={task.status}
                                      hasError={errorTaskIdSet.has(task._id)}
                                      scheduledAt={task.scheduledAt}
                                      tags={task.tags}
                                      createdByUser={users?.find(
                                        (u) => u._id === task.createdBy,
                                      )}
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
                                      onToggleSelect={() =>
                                        onToggleSelect(task._id)
                                      }
                                      groupedCodebases={
                                        groupedCodebases ?? undefined
                                      }
                                      assignedTo={task.assignedTo}
                                      model={task.model}
                                      projectId={task.projectId}
                                      repoId={task.repoId ?? repoId}
                                      users={users ?? undefined}
                                      currentUserId={currentUserId ?? undefined}
                                      projects={projectsList ?? undefined}
                                    />
                                  </ListItem>
                                );
                              }}
                            />
                          )}
                        </ListItems>
                      )}
                    </CollapsibleContent>
                  </ListGroup>
                </Collapsible>
              );
            },
          )}
        </div>
      </ListProvider>
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
