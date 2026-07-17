import { createFileRoute, redirect } from "@tanstack/react-router";
import { Spinner } from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import {
  combineResolveStatuses,
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
  const combinedStatus = combineResolveStatuses(
    projectResolve.status,
    taskResolve.status,
  );

  if (projectResolve.status === "not-found") {
    return (
      <EntityNotFound entityLabel="project" backTo={`${basePath}/projects`} />
    );
  }

  if (taskResolve.status === "not-found") {
    return (
      <EntityNotFound
        entityLabel="task"
        backTo={`${basePath}/projects/${numId}`}
        backLabel="Back to project"
      />
    );
  }

  if (combinedStatus === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isTaskDetailTab(detailTab)) {
    return null;
  }

  const projectId = projectResolve.convexId;
  const taskId = taskResolve.convexId;
  if (projectId === null || taskId === null) {
    return null;
  }

  return (
    <ProjectDetailClient
      projectId={projectId}
      projectNumId={projectResolve.numId ?? undefined}
      surface="main"
      selectedTaskId={taskId}
      detailTab={detailTab}
    />
  );
}
