import { createFileRoute } from "@tanstack/react-router";
import { ProjectSandboxReviewPage } from "./-ProjectSandboxReviewPage";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$numId/sandbox/review/recap",
)({
  component: ProjectSandboxReviewRecapRoute,
});

function ProjectSandboxReviewRecapRoute() {
  const { numId } = Route.useParams();
  return <ProjectSandboxReviewPage numId={numId} />;
}
