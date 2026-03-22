import { createFileRoute } from "@tanstack/react-router";
import type { Id } from "@conductor/backend";
import { DesignDetailClient } from "./DesignDetailClient";

export const Route = createFileRoute("/_repo/$owner/$repo/designs/$id")({
  component: DesignDetailRoute,
});

function DesignDetailRoute() {
  const { id } = Route.useParams();
  return (
    <DesignDetailClient
      designSessionId={id as Id<"designSessions">}
    />
  );
}
