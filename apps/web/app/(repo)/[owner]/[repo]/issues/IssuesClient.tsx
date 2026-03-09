"use client";

import { useMemo, useState } from "react";
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
import { IssueModal, ImportLinearModal } from "@/lib/components/issues";
import { IssuesKanbanBoard } from "@/lib/components/issues/IssuesKanbanBoard";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import {
  searchParser,
  issueViewParser,
  projectFilterParser,
  taskIdParser,
} from "@/lib/search-params";
import { IconChecklist } from "@tabler/icons-react";
import { IssuesToolbar } from "./_components/IssuesToolbar";
import { IssuesBulkBar, type BulkAction } from "./_components/IssuesBulkBar";
import { IssuesBulkModals } from "./_components/IssuesBulkModals";
import { IssuesSplitView } from "./_components/IssuesSplitView";

export function IssuesClient() {
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
    view: issueViewParser,
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

  const issues = useMemo(() => {
    if (!tasks) return [];
    if (project === "all") return tasks;
    if (project === "none") return tasks.filter((t) => !t.projectId);
    return tasks.filter((t) => t.projectId === project);
  }, [tasks, project]);
  const hasAnyTasks = (tasks ?? []).length > 0;
  const hasIssues = issues.length > 0;
  const selectedTasks = issues.filter((t) => selectedIds.has(t._id));

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

  useHotkey("Alt+N", (e) => {
    e.preventDefault();
    setIsCreating(true);
  });

  return (
    <>
      <PageWrapper
        title="Issues"
        fillHeight
        childPadding={false}
        headerRight={
          <IssuesToolbar
            view={view}
            onViewChange={(v: "kanban" | "list") => setParams({ view: v })}
            searchQuery={searchQuery}
            onSearchChange={(v) => setParams({ q: v })}
            hasIssues={hasAnyTasks}
            isSelecting={isSelecting}
            onStartSelecting={() => setIsSelecting(true)}
            onCreateTask={() => setIsCreating(true)}
            onImport={() => setIsImporting(true)}
            projects={projects}
            projectFilter={project}
            onProjectFilterChange={(v) => setParams({ project: v })}
          />
        }
      >
        <div className="relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden px-2 pb-2 pt-2 sm:px-3">
          <AnimatePresence mode="wait">
            {tasks === undefined ? (
              <motion.div
                key="issues-loading"
                className="flex flex-1 items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Spinner />
              </motion.div>
            ) : !hasIssues ? (
              <motion.div
                key="issues-empty"
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
                  title="No issues"
                  description="Issues are standalone tasks not tied to a feature. Create one for small, one-off work."
                  actionLabel="Create Issue"
                  onAction={() => setIsCreating(true)}
                />
              </motion.div>
            ) : view === "kanban" ? (
              <motion.div
                key="issues-board"
                className="flex min-w-0 flex-1 min-h-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <IssuesKanbanBoard
                  tasks={issues}
                  projectNames={projectNames}
                  isSelecting={isSelecting}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onOpenTask={handleOpenTask}
                />
              </motion.div>
            ) : (
              <motion.div
                key="issues-list"
                className="flex min-w-0 flex-1 min-h-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <IssuesSplitView
                  isSelecting={isSelecting}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onOpenTask={handleOpenTask}
                  selectedTaskId={typedSelectedTaskId}
                  onCloseTask={handleTaskClose}
                  issues={issues}
                  projectNames={projectNames}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {hasIssues && (
            <IssuesBulkBar
              isSelecting={isSelecting}
              selectedCount={selectedIds.size}
              onExitSelect={exitSelectMode}
              activeBulkAction={activeBulkAction}
              onSetBulkAction={setActiveBulkAction}
            />
          )}
        </div>
      </PageWrapper>
      <IssueModal isOpen={isCreating} onClose={() => setIsCreating(false)} />
      <ImportLinearModal
        isOpen={isImporting}
        onClose={() => setIsImporting(false)}
      />
      <IssuesBulkModals
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
