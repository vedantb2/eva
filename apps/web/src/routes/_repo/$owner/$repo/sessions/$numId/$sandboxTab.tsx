import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useSessionByNumId } from "@/lib/useResolveByNumId";
import { SessionDetailClient } from "../SessionDetailClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/$sandboxTab",
)({
  component: SessionSandboxRoute,
});

// The tab segment is a builtin SandboxTab or a custom tab's Convex id. Custom
// ids can't be validated synchronously here (they live in Convex), so the raw
// segment is passed through and SandboxPanel falls back to "preview" if it
// resolves to no known tab.
function SessionSandboxRoute() {
  const { numId, sandboxTab } = Route.useParams();
  const navigate = useNavigate();
  const { basePath, repoId } = useRepo();
  const { status, convexId } = useSessionByNumId(numId, repoId);

  return (
    <EntityNumIdGate status={status} convexId={convexId}>
      {(sessionId) => (
        <SessionDetailClient
          sessionId={sessionId}
          activeSandboxTab={sandboxTab}
          onSandboxTabChange={(next) => {
            navigate({
              to: `${basePath}/sessions/${numId}/${next}`,
            });
          }}
        />
      )}
    </EntityNumIdGate>
  );
}
