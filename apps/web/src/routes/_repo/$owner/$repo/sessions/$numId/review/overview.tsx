import { createFileRoute } from "@tanstack/react-router";
import { SessionReviewPage } from "./-SessionReviewPage";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/review/overview",
)({
  component: SessionReviewOverviewRoute,
});

function SessionReviewOverviewRoute() {
  const { numId } = Route.useParams();
  return <SessionReviewPage numId={numId} />;
}
