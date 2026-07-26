import { createFileRoute } from "@tanstack/react-router";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useDesignSessionByNumId } from "@/lib/useResolveByNumId";
import { DesignDetailClient } from "./DesignDetailClient";

export const Route = createFileRoute("/_repo/$owner/$repo/designs/$numId")({
  staticData: { title: "Designs" },
  component: DesignDetailRoute,
});

function DesignDetailRoute() {
  const { numId } = Route.useParams();
  const { basePath, repoId } = useRepo();
  const { status, convexId } = useDesignSessionByNumId(numId, repoId);

  return (
    <EntityNumIdGate
      status={status}
      convexId={convexId}
      entityLabel="design session"
      backTo={`${basePath}/designs`}
    >
      {(designSessionId) => (
        <DesignDetailClient designSessionId={designSessionId} />
      )}
    </EntityNumIdGate>
  );
}
