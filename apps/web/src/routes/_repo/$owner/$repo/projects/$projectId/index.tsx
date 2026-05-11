import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailClient } from "../ProjectDetailClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$projectId/",
)({
  component: ProjectDetailIndex,
});

function ProjectDetailIndex() {
  const { projectId } = Route.useParams();
  return <ProjectDetailClient projectId={projectId} surface="main" />;
}
