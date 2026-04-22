import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useNavigate } from "@tanstack/react-router";
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
import { QuickTasksTableView } from "@/lib/components/quick-tasks/QuickTasksTableView";
import { IconChecklist } from "@tabler/icons-react";
import { TASK_STATUSES } from "@/lib/components/tasks/TaskStatusBadge";
import { QuickTasksToolbar } from "./_components/QuickTasksToolbar";
import { ActiveFiltersBar } from "./_components/ActiveFiltersBar";
import {
  QuickTasksBulkBar,
  type BulkAction,
} from "./_components/QuickTasksBulkBar";
import { QuickTasksBulkModals } from "./_components/QuickTasksBulkModals";
import { useQuickTaskFilters } from "./_utils";

export function QuickTasksClient() {
  const navigate = useNavigate();
  const { basePath, repo } = useRepo();
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
  const [
    {
      q,
      view,
      project,
      user,
      assignee,
      tags,
      sortField,
      sortDir,
      timeRange,
      statuses,
    },
    setParams,
  ] = useQuickTaskFilters();
  const searchQuery = q;

  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const users = useQuery(api.users.listAll);

  const projectNames = useMemo(() => {
    const map = new Map<string, string>();
    if (projects) {
      for (const p of projects) {
        map.set(p._id, p.title);
      }
    }
    return map;
  }, [projects]);

  const allTags = useMemo(() => {
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
  }, [tasks]);

  const quickTasks = useMemo(() => {
    if (!tasks) return [];
    let filtered = tasks;

    // Project filter
    if (project !== "all") {
      filtered =
        project === "none"
          ? filtered.filter((t) => !t.projectId)
          : filtered.filter((t) => t.projectId === project);
    }

    // Created by filter
    if (user !== "all") {
      filtered = filtered.filter((t) => t.createdBy === user);
    }

    // Assignee filter
    if (assignee !== "all") {
      filtered =
        assignee === "unassigned"
          ? filtered.filter((t) => !t.assignedTo)
          : filtered.filter((t) => t.assignedTo === assignee);
    }

    // Status filter (exclude drafts, they're not shown in quick tasks view)
    const statusSet = new Set<string>(statuses);
    filtered = filtered.filter(
      (t) => t.status !== "draft" && statusSet.has(t.status),
    );

    // Tags filter
    if (tags.length > 0) {
      const tagSet = new Set(tags);
      filtered = filtered.filter(
        (t) => t.tags && t.tags.some((tag) => tagSet.has(tag)),
      );
    }

    // Time range filter
    if (timeRange !== "all") {
      const now = Date.now();
      const msMap: Record<string, number> = {
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        "90d": 90 * 24 * 60 * 60 * 1000,
      };
      const cutoff = now - (msMap[timeRange] ?? 0);
      filtered = filtered.filter((t) => t.createdAt >= cutoff);
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "lastRun") {
        const aTime = a.lastRunStartedAt ?? 0;
        const bTime = b.lastRunStartedAt ?? 0;
        cmp = aTime - bTime;
      } else if (sortField === "updated") {
        cmp = a.updatedAt - b.updatedAt;
      } else if (sortField === "created") {
        cmp = a.createdAt - b.createdAt;
      } else if (sortField === "title") {
        cmp = a.title.localeCompare(b.title);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [
    tasks,
    project,
    user,
    assignee,
    statuses,
    tags,
    timeRange,
    sortField,
    sortDir,
  ]);
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

  const activeFilterLabels = useMemo(() => {
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
            "Assignee");
      labels.push({ key: "assignee", label: `Assigned to: ${name}` });
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
  }, [project, projects, user, users, assignee, statuses, tags, timeRange]);

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

  const handleOpenTask = (id: string) => {
    navigate({ to: `${basePath}/quick-tasks/${id}` });
  };

  const closeBulkAction = () => setActiveBulkAction(null);

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
        title="Quick Tasks"
        fillHeight
        childPadding={false}
        headerRight={
          <QuickTasksToolbar
            view={view}
            onViewChange={(v: "kanban" | "list" | "table") =>
              setParams({ view: v })
            }
            searchQuery={searchQuery}
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
            ) : view === "table" ? (
              <motion.div
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
