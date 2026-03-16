"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryStates } from "nuqs";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Spinner } from "@conductor/ui";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import {
  QuickTaskModal,
  ImportLinearModal,
} from "@/lib/components/quick-tasks";
import { QuickTasksKanbanBoard } from "@/lib/components/quick-tasks/QuickTasksKanbanBoard";
import { QuickTasksListView } from "@/lib/components/quick-tasks/QuickTasksListView";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import {
  searchParser,
  quickTaskViewParser,
  projectFilterParser,
  taskIdParser,
} from "@/lib/search-params";
import { IconChecklist, IconChevronRight } from "@tabler/icons-react";
import { QuickTasksToolbar } from "./_components/QuickTasksToolbar";
import {
  QuickTasksBulkBar,
  type BulkAction,
} from "./_components/QuickTasksBulkBar";
import { QuickTasksBulkModals } from "./_components/QuickTasksBulkModals";

export function QuickTasksClient() {
  const { repo } = useRepo();
  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"agentTasks">>>(
    new Set(),
  );
  const [activeBulkAction, setActiveBulkAction] = useState<BulkAction | null>(
    null,
  );
  const [{ q, view, project, taskId }, setParams] = useQueryStates({
    q: searchParser,
    view: quickTaskViewParser,
    project: projectFilterParser,
    taskId: taskIdParser,
  });
  const searchQuery = q;

  const projects = useQuery(api.projects.list, { repoId: repo._id });

  const projectNames = useMemo(() => {
    const map = new Map<string, string>();
    if (projects) {
      for (const p of projects) {
        map.set(p._id, p.title);
      }
    }
    return map;
  }, [projects]);

  const quickTasks = useMemo(() => {
    if (!tasks) return [];
    if (project === "all") return tasks;
    if (project === "none") return tasks.filter((t) => !t.projectId);
    return tasks.filter((t) => t.projectId === project);
  }, [tasks, project]);
  const hasAnyTasks = (tasks ?? []).length > 0;
  const hasQuickTasks = quickTasks.length > 0;

  const taskIdSet = useMemo(() => {
    const set = new Set<string>();
    if (tasks) {
      for (const t of tasks) set.add(t._id);
    }
    return set;
  }, [tasks]);

  useEffect(() => {
    if (!isSelecting) return;
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<Id<"agentTasks">>();
      for (const id of prev) {
        if (taskIdSet.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [taskIdSet, isSelecting]);

  const selectedTasks = quickTasks.filter((t) => selectedIds.has(t._id));

  const toggleSelect = (id: Id<"agentTasks">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exitSelectMode = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
    setActiveBulkAction(null);
  };

  const handleOpenTask = (id: string) => {
    setParams({ taskId: id });
  };

  const handleTaskClose = () => {
    setParams({ taskId: null });
  };

  const closeBulkAction = () => setActiveBulkAction(null);
  const typedSelectedTaskId = taskId as Id<"agentTasks"> | null;
  const isListDetailView = view === "list" && !!typedSelectedTaskId;
  const selectedTask = useMemo(() => {
    if (!typedSelectedTaskId || !tasks) return undefined;
    return tasks.find((t) => t._id === typedSelectedTaskId);
  }, [typedSelectedTaskId, tasks]);

  useHotkey("Alt+N", (e) => {
    e.preventDefault();
    setIsCreating(true);
  });

  if (tasks === undefined) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageWrapper
        title={
          isListDetailView ? (
            <div className="flex items-center gap-1.5 text-base sm:text-lg md:text-xl">
              <button
                onClick={handleTaskClose}
                className="text-muted-foreground hover:text-foreground transition-colors font-semibold"
              >
                Quick Tasks
              </button>
              <IconChevronRight
                size={14}
                className="text-muted-foreground/50 flex-shrink-0"
              />
              <span className="truncate font-semibold">
                {selectedTask?.taskNumber ? `#${selectedTask.taskNumber}` : ""}
                {selectedTask?.title ? ` ${selectedTask.title}` : ""}
              </span>
            </div>
          ) : (
            "Quick Tasks"
          )
        }
        fillHeight
        childPadding={false}
        headerRight={
          isListDetailView ? undefined : (
            <QuickTasksToolbar
              view={view}
              onViewChange={(v: "kanban" | "list") => setParams({ view: v })}
              searchQuery={searchQuery}
              onSearchChange={(v) => setParams({ q: v })}
              hasQuickTasks={hasAnyTasks}
              isSelecting={isSelecting}
              onStartSelecting={() => setIsSelecting(true)}
              onCreateTask={() => setIsCreating(true)}
              onImport={() => setIsImporting(true)}
              projects={projects}
              projectFilter={project}
              onProjectFilterChange={(v) => setParams({ project: v })}
            />
          )
        }
      >
        <div className="relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden p-3 pt-0">
          <AnimatePresence mode="wait">
            {!hasQuickTasks ? (
              <motion.div
                key="quick-tasks-empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <EmptyState
                  icon={
                    <IconChecklist
                      size={24}
                      className="text-muted-foreground"
                    />
                  }
                  title="No quick tasks"
                  description="Quick tasks are standalone tasks not tied to a feature. Create one for small, one-off work."
                  actionLabel="Create Quick Task"
                  onAction={() => setIsCreating(true)}
                />
              </motion.div>
            ) : isListDetailView ? (
              <motion.div
                key="quick-tasks-detail"
                className="flex min-w-0 flex-1 min-h-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex-1 min-h-0 overflow-hidden">
                  <TaskDetailInline
                    key={typedSelectedTaskId}
                    onClose={handleTaskClose}
                    taskId={typedSelectedTaskId}
                  />
                </div>
              </motion.div>
            ) : view === "kanban" ? (
              <motion.div
                key="quick-tasks-board"
                className="flex min-w-0 flex-1 min-h-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <QuickTasksKanbanBoard
                  tasks={quickTasks}
                  projectNames={projectNames}
                  isSelecting={isSelecting}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onOpenTask={handleOpenTask}
                />
              </motion.div>
            ) : (
              <motion.div
                key="quick-tasks-list"
                className="flex min-w-0 flex-1 min-h-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <QuickTasksListView
                  tasks={quickTasks}
                  projectNames={projectNames}
                  isSelecting={isSelecting}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onOpenTask={handleOpenTask}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {hasQuickTasks && !isListDetailView && (
            <QuickTasksBulkBar
              isSelecting={isSelecting}
              selectedCount={selectedIds.size}
              onExitSelect={exitSelectMode}
              activeBulkAction={activeBulkAction}
              onSetBulkAction={setActiveBulkAction}
            />
          )}
        </div>
      </PageWrapper>
      <QuickTaskModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />
      <ImportLinearModal
        isOpen={isImporting}
        onClose={() => setIsImporting(false)}
      />
      <QuickTasksBulkModals
        activeBulkAction={activeBulkAction}
        onCloseBulkAction={closeBulkAction}
        selectedTaskIds={selectedIds}
        selectedTasks={selectedTasks}
        onSuccess={exitSelectMode}
      />
      {typedSelectedTaskId && view === "kanban" && (
        <TaskDetailModal
          isOpen={!!typedSelectedTaskId}
          onClose={handleTaskClose}
          taskId={typedSelectedTaskId}
        />
      )}
    </>
  );
}
