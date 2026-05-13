import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailClient } from "../ProjectDetailClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$projectId/$taskId",
)({
  component: ProjectDetailWithTask,
});

function ProjectDetailWithTask() {
  const { projectId, taskId } = Route.useParams();
  return (
    <ProjectDetailClient
      projectId={projectId}
      surface="main"
      selectedTaskId={taskId}
    />
  );
}
