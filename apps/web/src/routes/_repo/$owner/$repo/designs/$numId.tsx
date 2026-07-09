import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { Spinner } from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { parseRouteNumId } from "@/lib/numId";
import { DesignDetailClient } from "./DesignDetailClient";

export const Route = createFileRoute("/_repo/$owner/$repo/designs/$numId")({
  component: DesignDetailRoute,
});

function DesignDetailRoute() {
  const { numId } = Route.useParams();
  const { repoId } = useRepo();
  const parsedNumId = parseRouteNumId(numId);
  const designSession = useQuery(
    api.designSessions.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );

  if (parsedNumId === null) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Not found
      </div>
    );
  }

  if (designSession === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (designSession === null) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Not found
      </div>
    );
  }

  return <DesignDetailClient designSessionId={designSession._id} />;
}
