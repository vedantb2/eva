import { useMemo } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryStates } from "nuqs";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useNavigate } from "@tanstack/react-router";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Spinner } from "@conductor/ui";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import { IconChevronRight, IconChevronLeft } from "@tabler/icons-react";
import { TASK_STATUSES } from "@/lib/components/tasks/TaskStatusBadge";
import {
  quickTaskViewParser,
  projectFilterParser,
  userFilterParser,
} from "@/lib/search-params";
import { Route } from "./$taskId";
import { EntityContextUsage } from "@/lib/components/context-usage";

export function QuickTaskDetailClient() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const { basePath, repo } = useRepo();
  const [{ view, project, user }] = useQueryStates({
    view: quickTaskViewParser,
    project: projectFilterParser,
    user: userFilterParser,
  });
  const typedTaskId = taskId as Id<"agentTasks">;

  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });

  const selectedTask = useMemo(() => {
    if (!tasks) return undefined;
    return tasks.find((t) => t._id === typedTaskId);
  }, [typedTaskId, tasks]);

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
    return filtered;
  }, [tasks, project, user]);

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

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (view !== "kanban") params.set("view", view);
    if (project !== "none") params.set("project", project);
    if (user !== "all") params.set("user", user);
    const str = params.toString();
    return str ? `?${str}` : "";
  }, [view, project, user]);

  const handleBack = () => {
    navigate({ to: `${basePath}/quick-tasks${queryParams}` });
  };

  const handleNavigatePrev = () => {
    if (prevTaskId)
      navigate({ to: `${basePath}/quick-tasks/${prevTaskId}${queryParams}` });
  };

  const handleNavigateNext = () => {
    if (nextTaskId)
      navigate({ to: `${basePath}/quick-tasks/${nextTaskId}${queryParams}` });
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
          />
        </div>
      </div>
    </PageWrapper>
  );
}
