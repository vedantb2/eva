import { createFileRoute } from "@tanstack/react-router";
import { SessionReviewPage } from "./-SessionReviewPage";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/review/recap",
)({
  component: SessionReviewRecapRoute,
});

function SessionReviewRecapRoute() {
  const { numId } = Route.useParams();
  return <SessionReviewPage numId={numId} />;
}
