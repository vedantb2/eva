import { createFileRoute } from "@tanstack/react-router";
import { SessionPrPage } from "./-SessionPrPage";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/pr/recap",
)({
  component: SessionPrRecapRoute,
});

function SessionPrRecapRoute() {
  const { numId } = Route.useParams();
  return <SessionPrPage numId={numId} />;
}
