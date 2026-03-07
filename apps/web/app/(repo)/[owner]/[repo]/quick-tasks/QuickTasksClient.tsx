"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { usePathname } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useRepo } from "@/lib/contexts/RepoContext";
import { normalizePathname } from "@/lib/utils/repoUrl";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Spinner } from "@conductor/ui";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import {
  QuickTaskModal,
  ImportLinearModal,
} from "@/lib/components/quick-tasks";
import { QuickTasksKanbanBoard } from "@/lib/components/quick-tasks/QuickTasksKanbanBoard";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import { searchParser, quickTaskViewParser } from "@/lib/search-params";
import { IconChecklist } from "@tabler/icons-react";
import { QuickTasksToolbar } from "./_components/QuickTasksToolbar";
import {
  QuickTasksBulkBar,
  type BulkAction,
} from "./_components/QuickTasksBulkBar";
import { QuickTasksBulkModals } from "./_components/QuickTasksBulkModals";
import { QuickTasksSplitView } from "./_components/QuickTasksSplitView";

interface QuickTasksClientProps {
  initialTaskId?: string;
}

export function QuickTasksClient({ initialTaskId }: QuickTasksClientProps) {
  const { repo, basePath } = useRepo();
  const pathname = normalizePathname(usePathname());
  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    initialTaskId ?? null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<Id<"agentTasks">>>(
    new Set(),
  );
  const [activeBulkAction, setActiveBulkAction] = useState<BulkAction | null>(
    null,
  );
  const [{ q, view }, setParams] = useQueryStates({
    q: searchParser,
    view: quickTaskViewParser,
  });
  const searchQuery = q;
  const quickTasksPath = `${basePath}/quick-tasks`;
  const quickTaskPathPrefix = `${quickTasksPath}/`;

  const quickTasks = tasks?.filter((t) => !t.projectId) ?? [];
  const hasQuickTasks = quickTasks.length > 0;
  const selectedTasks = quickTasks.filter((t) => selectedIds.has(t._id));

  useEffect(() => {
    setSelectedTaskId(initialTaskId ?? null);
  }, [initialTaskId]);

  useEffect(() => {
    if (pathname === quickTasksPath) {
      setSelectedTaskId((prev) => (prev === null ? prev : null));
      return;
    }

    if (!pathname.startsWith(quickTaskPathPrefix)) {
      return;
    }

    const pathTaskId = pathname.slice(quickTaskPathPrefix.length);
    if (!pathTaskId || pathTaskId.includes("/")) {
      return;
    }

    setSelectedTaskId((prev) => (prev === pathTaskId ? prev : pathTaskId));
  }, [pathname, quickTaskPathPrefix, quickTasksPath]);

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

  const handleOpenTask = (taskId: string) => {
    const taskPath = `${quickTaskPathPrefix}${taskId}`;
    const isSameTaskOpen = selectedTaskId === taskId;
    if (!isSameTaskOpen) {
      setSelectedTaskId(taskId);
    }
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== taskPath
    ) {
      window.history.pushState(null, "", taskPath + window.location.search);
    }
  };

  const handleTaskClose = () => {
    setSelectedTaskId(null);
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith(quickTaskPathPrefix)
    ) {
      window.history.replaceState(
        null,
        "",
        quickTasksPath + window.location.search,
      );
    }
  };

  const closeBulkAction = () => setActiveBulkAction(null);
  const typedSelectedTaskId = selectedTaskId as Id<"agentTasks"> | null;

  return (
    <>
      <PageWrapper
        title="Quick Tasks"
        fillHeight
        childPadding={false}
        headerRight={
          <QuickTasksToolbar
            view={view}
            onViewChange={(v: "kanban" | "list") => setParams({ view: v })}
            searchQuery={searchQuery}
            onSearchChange={(v) => setParams({ q: v })}
            hasQuickTasks={hasQuickTasks}
            isSelecting={isSelecting}
            onStartSelecting={() => setIsSelecting(true)}
            onCreateTask={() => setIsCreating(true)}
            onImport={() => setIsImporting(true)}
          />
        }
      >
        <div className="relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden px-1.5 pb-2 pt-2 sm:px-2">
          <AnimatePresence mode="wait">
            {tasks === undefined ? (
              <motion.div
                key="quick-tasks-loading"
                className="flex flex-1 items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Spinner />
              </motion.div>
            ) : !hasQuickTasks ? (
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
                  repoId={repo._id}
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
                <QuickTasksSplitView
                  repoId={repo._id}
                  isSelecting={isSelecting}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onOpenTask={handleOpenTask}
                  selectedTaskId={typedSelectedTaskId}
                  onCloseTask={handleTaskClose}
                  quickTasks={quickTasks}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {hasQuickTasks && (
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
