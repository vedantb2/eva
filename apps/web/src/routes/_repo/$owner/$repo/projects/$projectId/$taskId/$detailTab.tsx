import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProjectDetailClient } from "../../ProjectDetailClient";
import { isTaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$projectId/$taskId/$detailTab",
)({
  beforeLoad: ({ params }) => {
    if (!isTaskDetailTab(params.detailTab)) {
      throw redirect({
        to: "/$owner/$repo/projects/$projectId/$taskId/$detailTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          projectId: params.projectId,
          taskId: params.taskId,
          detailTab: "activity",
        },
      });
    }
  },
  component: ProjectDetailWithTask,
});

function ProjectDetailWithTask() {
  const { projectId, taskId, detailTab } = Route.useParams();
  if (!isTaskDetailTab(detailTab)) {
    return null;
  }
  return (
    <ProjectDetailClient
      projectId={projectId}
      surface="main"
      selectedTaskId={taskId}
      detailTab={detailTab}
    />
  );
}
