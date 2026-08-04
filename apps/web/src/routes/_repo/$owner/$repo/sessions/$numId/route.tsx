import { createFileRoute } from "@tanstack/react-router";
import { SessionRouteShell } from "../_components/SessionRouteShell";

/** Inactive sessions unmount, so their subscriptions and effects cannot run. */
export const Route = createFileRoute("/_repo/$owner/$repo/sessions/$numId")({
  component: SessionRoute,
});

function SessionRoute() {
  const { numId } = Route.useParams();
  return <SessionRouteShell numId={numId} />;
}
