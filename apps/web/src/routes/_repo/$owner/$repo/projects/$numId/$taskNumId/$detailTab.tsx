import { createFileRoute, redirect } from "@tanstack/react-router";
import { Spinner } from "@eva/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import {
  useAgentTaskByNumId,
  useProjectByNumId,
} from "@/lib/useResolveByNumId";
import { ProjectDetailClient } from "../../ProjectDetailClient";
import { isTaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$numId/$taskNumId/$detailTab",
)({
  beforeLoad: ({ params }) => {
    if (!isTaskDetailTab(params.detailTab)) {
      throw redirect({
        to: "/$owner/$repo/projects/$numId/$taskNumId/$detailTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          taskNumId: params.taskNumId,
          detailTab: "activity",
        },
      });
    }
  },
  component: ProjectDetailWithTask,
});

function ProjectDetailWithTask() {
  const { numId, taskNumId, detailTab } = Route.useParams();
  const { basePath, repoId } = useRepo();
  const projectResolve = useProjectByNumId(numId, repoId);
  const taskResolve = useAgentTaskByNumId(taskNumId, repoId);

  // Full-page loading/not-found gates only on the project resolve — the task
  // resolve (loading/not-found) is handled inside ProjectDetailClient's
  // detail pane so the project's task list never unmounts when switching
  // between tasks.
  if (projectResolve.status === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (projectResolve.status === "not-found") {
    return (
      <EntityNotFound entityLabel="project" backTo={`${basePath}/projects`} />
    );
  }

  if (!isTaskDetailTab(detailTab)) {
    return null;
  }

  const projectId = projectResolve.convexId;
  if (projectId === null) {
    return null;
  }

  return (
    <ProjectDetailClient
      projectId={projectId}
      projectNumId={projectResolve.numId ?? undefined}
      surface="main"
      selectedTaskId={taskResolve.convexId ?? undefined}
      selectedTaskStatus={taskResolve.status}
      detailTab={detailTab}
    />
  );
}
