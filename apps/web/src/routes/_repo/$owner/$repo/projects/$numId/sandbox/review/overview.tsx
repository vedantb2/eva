import { createFileRoute } from "@tanstack/react-router";
import { ProjectSandboxReviewPage } from "./-ProjectSandboxReviewPage";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$numId/sandbox/review/overview",
)({
  component: ProjectSandboxReviewOverviewRoute,
});

function ProjectSandboxReviewOverviewRoute() {
  const { numId } = Route.useParams();
  return <ProjectSandboxReviewPage numId={numId} />;
}
