import { useMemo } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useNavigate } from "@tanstack/react-router";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Spinner } from "@conductor/ui";
import { TaskDetailInline } from "@/lib/components/tasks/TaskDetailInline";
import { IconChevronRight, IconChevronLeft } from "@tabler/icons-react";
import { TASK_STATUSES } from "@/lib/components/tasks/TaskStatusBadge";
import { quickTaskViewParser } from "@/lib/search-params";
import { Route } from "./$taskId";

export function QuickTaskDetailClient() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const { basePath, repo } = useRepo();
  const [view] = useQueryState("view", quickTaskViewParser);
  const typedTaskId = taskId as Id<"agentTasks">;

  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });

  const selectedTask = useMemo(() => {
    if (!tasks) return undefined;
    return tasks.find((t) => t._id === typedTaskId);
  }, [typedTaskId, tasks]);

  const orderedTasks = useMemo(() => {
    if (!tasks) return [];
    const byStatus = new Map<string, typeof tasks>();
    for (const task of tasks) {
      const list = byStatus.get(task.status) ?? [];
      list.push(task);
      byStatus.set(task.status, list);
    }
    const result: typeof tasks = [];
    for (const status of TASK_STATUSES) {
      const group = byStatus.get(status);
      if (group) {
        group.sort((a, b) => b.createdAt - a.createdAt);
        result.push(...group);
      }
    }
    return result;
  }, [tasks]);

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

  const viewParam = view === "kanban" ? "" : `?view=${view}`;

  const handleBack = () => {
    navigate({ to: `${basePath}/quick-tasks${viewParam}` });
  };

  const handleNavigatePrev = () => {
    if (prevTaskId)
      navigate({ to: `${basePath}/quick-tasks/${prevTaskId}${viewParam}` });
  };

  const handleNavigateNext = () => {
    if (nextTaskId)
      navigate({ to: `${basePath}/quick-tasks/${nextTaskId}${viewParam}` });
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
        <div className="flex items-center gap-1.5 text-base sm:text-lg md:text-xl">
          <button
            onClick={handleBack}
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
      }
      fillHeight
      childPadding={false}
      headerRight={
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
