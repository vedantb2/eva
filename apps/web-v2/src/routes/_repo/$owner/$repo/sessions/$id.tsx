import { createFileRoute } from "@tanstack/react-router";
import { SessionDetailClient } from "./SessionDetailClient";

export const Route = createFileRoute("/_repo/$owner/$repo/sessions/$id")({
  component: SessionDetailRoute,
});

function SessionDetailRoute() {
  const { id } = Route.useParams();
  return <SessionDetailClient sessionId={id} />;
}
