import { useEffect, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Spinner } from "@conductor/ui";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import {
  QuickTaskModal,
  ImportLinearModal,
} from "@/lib/components/quick-tasks";
import { QuickTasksKanbanBoard } from "@/lib/components/quick-tasks/QuickTasksKanbanBoard";
import { QuickTasksTableView } from "@/lib/components/quick-tasks/QuickTasksTableView";
import { QuickTasksListSplit } from "./_components/QuickTasksListSplit";
import { QuickTaskDetailShell } from "./_components/QuickTaskDetailShell";
import { QuickTaskTaskPageContent } from "./_components/QuickTaskTaskPageContent";
import { useQuickTaskRouteState } from "./_utils/useQuickTaskRouteState";
import { IconChecklist } from "@tabler/icons-react";
import { TASK_STATUSES } from "@/lib/components/tasks/TaskStatusBadge";
import { QuickTasksToolbar } from "./_components/QuickTasksToolbar";
import { ActiveFiltersBar } from "./_components/ActiveFiltersBar";
import {
  QuickTasksBulkBar,
  type BulkAction,
} from "./_components/QuickTasksBulkBar";
import { QuickTasksBulkModals } from "./_components/QuickTasksBulkModals";
import { useFilteredQuickTasks, useQuickTaskFilters } from "./_utils";
import { entityPathSegment } from "@/lib/numId";
import { useAgentTaskByNumId } from "@/lib/useResolveByNumId";

export function QuickTasksClient() {
  const navigate = useNavigate();
  // The open task (if any) comes from the child route params, read here at the
  // layout level so the list stays mounted while the detail changes.
  const params = useParams({ strict: false });
  const routeState = useQuickTaskRouteState();
  const numIdParam =
    typeof params.numId === "string" ? params.numId : undefined;
  const { basePath, repo, repoId } = useRepo();
  const taskResolve = useAgentTaskByNumId(numIdParam, repoId);
  const selectedTaskId =
    taskResolve.status === "ready"
      ? (taskResolve.convexId ?? undefined)
      : undefined;
  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });
  const { draft: draftParam } = useSearch({
    from: "/_repo/$owner/$repo/quick-tasks",
  });
  const drafts = useQuery(api.agentTasks.listDrafts, { repoId: repo._id });
  const initialDraft = draftParam
    ? drafts?.find((d) => d._id === draftParam)
    : undefined;
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"agentTasks">>>(
    new Set(),
  );
  const [activeBulkAction, setActiveBulkAction] = useState<BulkAction | null>(
    null,
  );
  const [
    { q, view, project, user, assignee, tags, timeRange, statuses },
    setParams,
  ] = useQuickTaskFilters();

  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const users = useQuery(api.users.listAll);

  const projectNames = (() => {
    const map = new Map<string, string>();
    if (projects) {
      for (const p of projects) {
        map.set(p._id, p.title);
      }
    }
    return map;
  })();

  const allTags = (() => {
    if (!tasks) return [];
    const tagSet = new Set<string>();
    for (const t of tasks) {
      if (t.tags) {
        for (const tag of t.tags) {
          tagSet.add(tag);
        }
      }
    }
    return [...tagSet].sort();
  })();

  const quickTasks = useFilteredQuickTasks(tasks);
  const hasAnyTasks = (tasks ?? []).length > 0;
  const hasQuickTasks = quickTasks.length > 0;

  const taskIdSet = (() => {
    const set = new Set<string>();
    if (tasks) {
      for (const t of tasks) set.add(t._id);
    }
    return set;
  })();

  // Drop selections for tasks that disappeared (adjust during render).
  if (isSelecting) {
    let needsPrune = false;
    for (const id of selectedIds) {
      if (!taskIdSet.has(id)) {
        needsPrune = true;
        break;
      }
    }
    if (needsPrune) {
      const next = new Set<Id<"agentTasks">>();
      for (const id of selectedIds) {
        if (taskIdSet.has(id)) next.add(id);
      }
      setSelectedIds(next);
    }
  }

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

  const activeFilterLabels = (() => {
    const labels: Array<{ key: string; label: string }> = [];
    if (project === "all") {
      labels.push({ key: "project", label: "All Projects" });
    } else if (project !== "none") {
      const name = projects?.find((p) => p._id === project)?.title ?? "Project";
      labels.push({ key: "project", label: `Project: ${name}` });
    }
    if (user !== "all") {
      const u = users?.find((u) => u._id === user);
      labels.push({
        key: "user",
        label: `Created by: ${u?.fullName ?? u?.firstName ?? "User"}`,
      });
    }
    if (assignee !== "all") {
      const name =
        assignee === "unassigned"
          ? "Unassigned"
          : (users?.find((u) => u._id === assignee)?.fullName ??
            users?.find((u) => u._id === assignee)?.firstName ??
            "Code Reviewer");
      labels.push({ key: "assignee", label: `Code reviewer: ${name}` });
    }
    if (statuses.length !== TASK_STATUSES.length) {
      labels.push({
        key: "statuses",
        label: `${statuses.length} Status${statuses.length !== 1 ? "es" : ""}`,
      });
    }
    if (tags.length > 0) {
      labels.push({
        key: "tags",
        label: `${tags.length} Tag${tags.length !== 1 ? "s" : ""}`,
      });
    }
    if (timeRange !== "all") {
      const rangeLabels: Record<string, string> = {
        "7d": "Last 7 days",
        "30d": "Last 30 days",
        "90d": "Last 90 days",
      };
      labels.push({
        key: "timeRange",
        label: rangeLabels[timeRange] ?? timeRange,
      });
    }
    return labels;
  })();

  const clearFilter = (key: string) => {
    switch (key) {
      case "project":
        setParams({ project: "none" });
        break;
      case "user":
        setParams({ user: "all" });
        break;
      case "assignee":
        setParams({ assignee: "all" });
        break;
      case "statuses":
        setParams({ statuses: [...TASK_STATUSES] });
        break;
      case "tags":
        setParams({ tags: [] });
        break;
      case "timeRange":
        setParams({ timeRange: "all" });
        break;
    }
  };

  const clearAllFilters = () => {
    setParams({
      project: "none",
      user: "all",
      assignee: "all",
      statuses: [...TASK_STATUSES],
      tags: [],
      timeRange: "all",
    });
  };

  const handleOpenTask = (task: { numId?: number }) => {
    const segment = entityPathSegment(task);
    if (!segment) return;
    navigate({ to: `${basePath}/quick-tasks/${segment}` });
  };

  const closeBulkAction = () => setActiveBulkAction(null);

  useHotkey("Alt+N", (e) => {
    e.preventDefault();
    setIsCreating(true);
  });

  const clearDraftParam = () => {
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, draft: undefined }),
      replace: true,
    });
  };

  const handleModalClose = () => {
    setIsCreating(false);
    if (draftParam !== undefined) {
      clearDraftParam();
    }
  };

  // If the drafts list has loaded and the param points to a non-existent draft
  // (deleted or stale link), clean up the URL.
  useEffect(() => {
    if (
      drafts !== undefined &&
      draftParam !== undefined &&
      initialDraft === undefined
    ) {
      clearDraftParam();
    }
    // clearDraftParam is defined inline each render — only run when these values change.
    // eslint-disable-next-line react/exhaustive-deps
  }, [drafts, draftParam, initialDraft]);

  if (tasks === undefined) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // URL points at a task that is still resolving or no longer exists.
  if (numIdParam !== undefined && taskResolve.status === "loading") {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (numIdParam !== undefined && taskResolve.status === "not-found") {
    return (
      <PageWrapper title="Quick Tasks" fillHeight childPadding={false}>
        <EntityNotFound
          entityLabel="task"
          backTo={`${basePath}/quick-tasks`}
          backLabel="Back to Quick Tasks"
        />
      </PageWrapper>
    );
  }

  // Kanban and table keep the dedicated full-page detail when a task is open.
  // List view instead renders the master/detail split further down.
  if (selectedTaskId && routeState && view !== "list") {
    return (
      <QuickTaskDetailShell
        taskId={selectedTaskId}
        detailTab={routeState.detailTab}
        navSurface={routeState.surface}
        sandboxTab={
          routeState.surface === "sandbox" ? routeState.sandboxTab : undefined
        }
      >
        <QuickTaskTaskPageContent
          taskId={selectedTaskId}
          routeState={routeState}
        />
      </QuickTaskDetailShell>
    );
  }

  return (
    <>
      <PageWrapper
        title="Quick Tasks"
        fillHeight
        childPadding={false}
        headerRight={
          <QuickTasksToolbar
            view={view}
            onViewChange={(v: "kanban" | "list" | "table") => {
              setParams({ view: v });
              // Only list view renders an open task inline (master/detail
              // split); kanban/table show the board, so close the task.
              if (selectedTaskId && v !== "list") {
                navigate({ to: `${basePath}/quick-tasks` });
              }
            }}
            searchQuery={q}
            onSearchChange={(v) => setParams({ q: v ?? "" })}
            hasQuickTasks={hasAnyTasks}
            isSelecting={isSelecting}
            onStartSelecting={() => setIsSelecting(true)}
            onCreateTask={() => setIsCreating(true)}
            onImport={() => setIsImporting(true)}
            projects={projects}
            projectFilter={project}
            onProjectFilterChange={(v) => setParams({ project: v })}
            users={users}
            userFilter={user}
            onUserFilterChange={(v) => setParams({ user: v })}
            allTags={allTags}
          />
        }
      >
        <div className="relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden p-3 pt-0">
          {activeFilterLabels.length > 0 && (
            <ActiveFiltersBar
              filters={activeFilterLabels}
              onClearFilter={clearFilter}
              onClearAll={clearAllFilters}
            />
          )}
          <AnimatePresence mode="wait" initial={false}>
            {!hasQuickTasks && !(view === "list" && selectedTaskId) ? (
              <m.div
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
              </m.div>
            ) : view === "kanban" ? (
              <m.div
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
              </m.div>
            ) : view === "table" ? (
              <m.div
                key="quick-tasks-table"
                className="flex min-w-0 flex-1 min-h-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <QuickTasksTableView
                  tasks={quickTasks}
                  projectNames={projectNames}
                  isSelecting={isSelecting}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onOpenTask={handleOpenTask}
                />
              </m.div>
            ) : (
              <m.div
                key="quick-tasks-list"
                className="flex min-w-0 flex-1 min-h-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <QuickTasksListSplit
                  tasks={quickTasks}
                  projectNames={projectNames}
                  isSelecting={isSelecting}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onOpenTask={handleOpenTask}
                  selectedTaskId={selectedTaskId}
                  detailTab={routeState?.detailTab}
                  sandboxTab={
                    routeState?.surface === "sandbox"
                      ? routeState.sandboxTab
                      : undefined
                  }
                  navSurface={routeState?.surface ?? "detail"}
                />
              </m.div>
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
        key={initialDraft?._id ?? "new"}
        isOpen={isCreating || initialDraft !== undefined}
        initialDraft={initialDraft}
        onClose={handleModalClose}
        users={users ?? undefined}
        projects={projects ?? undefined}
        allTags={allTags}
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
    </>
  );
}
