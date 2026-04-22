import { useMemo } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useNavigate } from "@tanstack/react-router";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Spinner } from "@conductor/ui";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import { IconChevronRight, IconChevronLeft } from "@tabler/icons-react";
import { TASK_STATUSES } from "@/lib/components/tasks/TaskStatusBadge";
import { Route } from "./$taskId";
import { EntityContextUsage } from "@/lib/components/context-usage";
import { useQuickTaskFilters } from "./_utils";

export function QuickTaskDetailClient() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const { basePath, repo } = useRepo();
  const [{ project, user, assignee, tags, timeRange, statuses }] =
    useQuickTaskFilters();
  const typedTaskId = taskId as Id<"agentTasks">;

  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });

  const selectedTask = useMemo(() => {
    if (!tasks) return undefined;
    return tasks.find((t) => t._id === typedTaskId);
  }, [typedTaskId, tasks]);

  const allTags = useMemo(() => {
    if (!tasks) return [];
    const tagSet = new Set<string>();
    for (const t of tasks) {
      if (t.tags) {
        for (const tag of t.tags) tagSet.add(tag);
      }
    }
    return [...tagSet].sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    let filtered = tasks;
    if (project !== "all") {
      filtered =
        project === "none"
          ? filtered.filter((t) => !t.projectId)
          : filtered.filter((t) => t.projectId === project);
    }
    if (user !== "all") {
      filtered = filtered.filter((t) => t.createdBy === user);
    }
    if (assignee !== "all") {
      filtered =
        assignee === "unassigned"
          ? filtered.filter((t) => !t.assignedTo)
          : filtered.filter((t) => t.assignedTo === assignee);
    }
    const statusSet = new Set<string>(statuses);
    filtered = filtered.filter(
      (t) => t.status !== "draft" && statusSet.has(t.status),
    );
    if (tags.length > 0) {
      const tagSet = new Set(tags);
      filtered = filtered.filter(
        (t) => t.tags && t.tags.some((tag) => tagSet.has(tag)),
      );
    }
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
    return filtered;
  }, [tasks, project, user, assignee, statuses, tags, timeRange]);

  const orderedTasks = useMemo(() => {
    if (filteredTasks.length === 0) return [];
    const byStatus = new Map<string, typeof filteredTasks>();
    for (const task of filteredTasks) {
      const list = byStatus.get(task.status) ?? [];
      list.push(task);
      byStatus.set(task.status, list);
    }
    const result: typeof filteredTasks = [];
    for (const status of TASK_STATUSES) {
      const group = byStatus.get(status);
      if (group) {
        group.sort((a, b) => b.createdAt - a.createdAt);
        result.push(...group);
      }
    }
    return result;
  }, [filteredTasks]);

  const { prevTaskId, nextTaskId } = useMemo(() => {
    if (orderedTasks.length === 0) {
      return { prevTaskId: null, nextTaskId: null };
    }
    const idx = orderedTasks.findIndex((t) => t._id === typedTaskId);
    if (idx === -1) return { prevTaskId: null, nextTaskId: null };
    return {
      prevTaskId: idx > 0 ? orderedTasks[idx - 1]._id : null,
      nextTaskId:
        idx < orderedTasks.length - 1 ? orderedTasks[idx + 1]._id : null,
    };
  }, [typedTaskId, orderedTasks]);

  const handleBack = () => {
    navigate({ to: `${basePath}/quick-tasks` });
  };

  const handleNavigatePrev = () => {
    if (prevTaskId) navigate({ to: `${basePath}/quick-tasks/${prevTaskId}` });
  };

  const handleNavigateNext = () => {
    if (nextTaskId) navigate({ to: `${basePath}/quick-tasks/${nextTaskId}` });
  };

  if (tasks === undefined) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <PageWrapper
      title={
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-base sm:text-lg md:text-xl">
          <button
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground transition-colors font-semibold whitespace-nowrap flex-shrink-0"
          >
            Quick Tasks
          </button>
          <IconChevronRight
            size={14}
            className="text-muted-foreground/50 flex-shrink-0"
          />
          <span className="min-w-0 flex-1 truncate font-semibold">
            {selectedTask?.taskNumber ? `#${selectedTask.taskNumber}` : ""}
            {selectedTask?.title ? ` ${selectedTask.title}` : ""}
          </span>
        </div>
      }
      fillHeight
      childPadding={false}
      headerRight={
        <div className="flex items-center gap-1">
          <EntityContextUsage repoId={repo._id} entityId={taskId} />
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleNavigatePrev}
              disabled={!prevTaskId}
              className="p-1 rounded hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="Previous task"
            >
              <IconChevronLeft size={16} />
            </button>
            <button
              onClick={handleNavigateNext}
              disabled={!nextTaskId}
              className="p-1 rounded hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="Next task"
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      }
    >
      <div className="relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden p-3 pt-0">
        <div className="flex-1 min-h-0 overflow-hidden">
          <TaskDetailInline
            key={typedTaskId}
            onClose={handleBack}
            taskId={typedTaskId}
            allTags={allTags}
          />
        </div>
      </div>
    </PageWrapper>
  );
}
