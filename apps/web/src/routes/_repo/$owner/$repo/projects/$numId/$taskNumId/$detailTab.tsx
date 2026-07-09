import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { Spinner } from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { parseRouteNumId } from "@/lib/numId";
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
  const { repoId } = useRepo();
  const parsedProjectNumId = parseRouteNumId(numId);
  const parsedTaskNumId = parseRouteNumId(taskNumId);
  const project = useQuery(
    api.projects.getByNumId,
    parsedProjectNumId !== null
      ? { repoId, numId: parsedProjectNumId }
      : "skip",
  );
  const task = useQuery(
    api.agentTasks.getByNumId,
    parsedTaskNumId !== null ? { repoId, numId: parsedTaskNumId } : "skip",
  );

  if (parsedProjectNumId === null || parsedTaskNumId === null) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Not found
      </div>
    );
  }

  if (project === undefined || task === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (project === null || task === null) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Not found
      </div>
    );
  }

  if (!isTaskDetailTab(detailTab)) {
    return null;
  }

  return (
    <ProjectDetailClient
      projectId={project._id}
      projectNumId={project.numId}
      surface="main"
      selectedTaskId={task._id}
      detailTab={detailTab}
    />
  );
}
