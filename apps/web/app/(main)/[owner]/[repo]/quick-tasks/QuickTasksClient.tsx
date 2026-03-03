"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { usePathname } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Spinner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import {
  QuickTaskModal,
  ImportLinearModal,
} from "@/lib/components/quick-tasks";
import { QuickTasksKanbanBoard } from "@/lib/components/quick-tasks/QuickTasksKanbanBoard";
import { QuickTasksListView } from "@/lib/components/quick-tasks/QuickTasksListView";
import { GroupTasksModal } from "@/lib/components/quick-tasks/GroupTasksModal";
import { DeleteTasksModal } from "@/lib/components/quick-tasks/DeleteTasksModal";
import { AddLabelsModal } from "@/lib/components/quick-tasks/AddLabelsModal";
import { AssignTasksModal } from "@/lib/components/quick-tasks/AssignTasksModal";
import { ChangeStatusModal } from "@/lib/components/quick-tasks/ChangeStatusModal";
import { RunTasksModal } from "@/lib/components/quick-tasks/RunTasksModal";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import { searchParser, quickTaskViewParser } from "@/lib/search-params";
import {
  IconChecklist,
  IconPlus,
  IconCheckbox,
  IconFolders,
  IconLayoutKanban,
  IconList,
  IconFileImport,
  IconBolt,
  IconTrash,
  IconTags,
  IconUser,
  IconUserCheck,
  IconRefresh,
  IconSearch,
  IconX,
  IconPlayerPlay,
} from "@tabler/icons-react";

type BulkAction =
  | "actions"
  | "group"
  | "delete"
  | "addLabels"
  | "assign"
  | "assignMe"
  | "changeStatus"
  | "run";

interface QuickTasksClientProps {
  initialTaskId?: string;
}

export function QuickTasksClient({ initialTaskId }: QuickTasksClientProps) {
  const { repo, basePath } = useRepo();
  const pathname = usePathname();
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [{ q, view }, setParams] = useQueryStates({
    q: searchParser,
    view: quickTaskViewParser,
  });
  const searchQuery = q;
  const showSearch = isSearchOpen || !!searchQuery;
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
      window.history.pushState(null, "", taskPath);
    }
  };

  const handleTaskClose = () => {
    setSelectedTaskId(null);
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith(quickTaskPathPrefix)
    ) {
      window.history.replaceState(null, "", quickTasksPath);
    }
  };

  return (
    <>
      <PageWrapper
        title="Quick Tasks"
        fillHeight
        childPadding={false}
        headerRight={
          <div className="flex items-center gap-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {hasQuickTasks && showSearch ? (
                <motion.div
                  key="task-search-input"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 176 }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="relative w-44">
                    <IconSearch
                      size={14}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      autoFocus
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setParams({ q: e.target.value || null })}
                      onBlur={() => {
                        if (!searchQuery) setIsSearchOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setParams({ q: null });
                          setIsSearchOpen(false);
                        }
                      }}
                      className="h-8 pl-7 pr-7 text-sm"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setParams({ q: null });
                          setIsSearchOpen(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <IconX size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : hasQuickTasks ? (
                <motion.div
                  key="task-search-icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.97]"
                        onClick={() => setIsSearchOpen(true)}
                      >
                        <IconSearch size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Search tasks</TooltipContent>
                  </Tooltip>
                </motion.div>
              ) : null}
            </AnimatePresence>
            {hasQuickTasks && (
              <div className="flex items-center rounded-lg border border-border overflow-hidden">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={view === "kanban" ? "secondary" : "ghost"}
                      size="icon"
                      className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]"
                      onClick={() => setParams({ view: "kanban" })}
                    >
                      <IconLayoutKanban size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Kanban view</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={view === "list" ? "secondary" : "ghost"}
                      size="icon"
                      className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]"
                      onClick={() => setParams({ view: "list" })}
                    >
                      <IconList size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>List view</TooltipContent>
                </Tooltip>
              </div>
            )}
            <AnimatePresence initial={false} mode="popLayout">
              {hasQuickTasks && !isSelecting ? (
                <motion.div
                  key="quick-task-select-action"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    className="motion-press hover:scale-[1.01] active:scale-[0.99]"
                    onClick={() => setIsSelecting(true)}
                  >
                    <IconCheckbox size={16} />
                    Select
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <Button
              size="sm"
              variant="secondary"
              className="motion-press hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => setIsImporting(true)}
            >
              <IconFileImport size={16} />
              Import from Linear
            </Button>
            <Button
              size="sm"
              className="motion-press hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => setIsCreating(true)}
            >
              <IconPlus size={16} />
              New Task
            </Button>
          </div>
        }
      >
        <div className="relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden px-2 pb-2 pt-2">
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
                <QuickTasksListView
                  repoId={repo._id}
                  isSelecting={isSelecting}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onOpenTask={handleOpenTask}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {hasQuickTasks && isSelecting && (
              <motion.div
                key="quick-tasks-actions-bottom"
                className="absolute inset-x-2 bottom-2 z-20 flex justify-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.18 }}
              >
                <div className="flex items-center gap-1 rounded-xl border border-border bg-background/95 p-1 shadow-lg backdrop-blur">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="motion-press hover:scale-[1.01] active:scale-[0.99]"
                    onClick={exitSelectMode}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="motion-press min-w-36 hover:scale-[1.01] active:scale-[0.99]"
                    onClick={() => setActiveBulkAction("actions")}
                    disabled={selectedIds.size === 0}
                  >
                    <IconBolt size={16} />
                    Actions
                    {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
      <GroupTasksModal
        isOpen={activeBulkAction === "group"}
        onClose={() => setActiveBulkAction(null)}
        selectedTaskIds={selectedIds}
        onSuccess={exitSelectMode}
      />
      <DeleteTasksModal
        isOpen={activeBulkAction === "delete"}
        onClose={() => setActiveBulkAction(null)}
        selectedTaskIds={selectedIds}
        onSuccess={exitSelectMode}
      />
      <AddLabelsModal
        isOpen={activeBulkAction === "addLabels"}
        onClose={() => setActiveBulkAction(null)}
        selectedTasks={selectedTasks}
        onSuccess={exitSelectMode}
      />
      <AssignTasksModal
        isOpen={activeBulkAction === "assign"}
        onClose={() => setActiveBulkAction(null)}
        selectedTaskIds={selectedIds}
        onSuccess={exitSelectMode}
        mode="pick"
      />
      <AssignTasksModal
        isOpen={activeBulkAction === "assignMe"}
        onClose={() => setActiveBulkAction(null)}
        selectedTaskIds={selectedIds}
        onSuccess={exitSelectMode}
        mode="me"
      />
      <ChangeStatusModal
        isOpen={activeBulkAction === "changeStatus"}
        onClose={() => setActiveBulkAction(null)}
        selectedTaskIds={selectedIds}
        onSuccess={exitSelectMode}
      />
      <RunTasksModal
        isOpen={activeBulkAction === "run"}
        onClose={() => setActiveBulkAction(null)}
        selectedTaskIds={selectedIds}
        onSuccess={exitSelectMode}
      />
      <Dialog
        open={activeBulkAction === "actions"}
        onOpenChange={(v) => {
          if (!v) setActiveBulkAction(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Selected task actions</DialogTitle>
            <DialogDescription>
              {selectedIds.size} task{selectedIds.size === 1 ? "" : "s"}{" "}
              selected
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => setActiveBulkAction("group")}
              disabled={selectedIds.size === 0}
            >
              <IconFolders size={16} />
              Group into Project
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => setActiveBulkAction("addLabels")}
              disabled={selectedIds.size === 0}
            >
              <IconTags size={16} />
              Add Labels
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => setActiveBulkAction("assign")}
              disabled={selectedIds.size === 0}
            >
              <IconUser size={16} />
              Assign to...
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => setActiveBulkAction("assignMe")}
              disabled={selectedIds.size === 0}
            >
              <IconUserCheck size={16} />
              Assign to Me
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => setActiveBulkAction("changeStatus")}
              disabled={selectedIds.size === 0}
            >
              <IconRefresh size={16} />
              Change Status
            </Button>
            <Button
              variant="secondary"
              className="justify-start"
              onClick={() => setActiveBulkAction("run")}
              disabled={selectedIds.size === 0}
            >
              <IconPlayerPlay size={16} />
              Run Tasks
            </Button>
            <Button
              variant="destructive"
              className="justify-start"
              onClick={() => setActiveBulkAction("delete")}
              disabled={selectedIds.size === 0}
            >
              <IconTrash size={16} />
              Delete All
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setActiveBulkAction(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selectedTaskId && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={handleTaskClose}
          taskId={selectedTaskId as Id<"agentTasks">}
        />
      )}
    </>
  );
}
