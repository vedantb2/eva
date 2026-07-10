import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useSessionByNumId } from "@/lib/useResolveByNumId";
import { SessionDetailClient } from "../SessionDetailClient";
import { isSessionSandboxTab, type SandboxTab } from "@/lib/search-params";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/$sandboxTab",
)({
  beforeLoad: ({ params }) => {
    if (!isSessionSandboxTab(params.sandboxTab)) {
      throw redirect({
        to: "/$owner/$repo/sessions/$numId/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          sandboxTab: "preview",
        },
      });
    }
  },
  component: SessionSandboxRoute,
});

function SessionSandboxRoute() {
  const { numId, sandboxTab } = Route.useParams();
  const navigate = useNavigate();
  const { basePath, repoId } = useRepo();
  const { status, convexId } = useSessionByNumId(numId, repoId);

  const tab: SandboxTab = isSessionSandboxTab(sandboxTab)
    ? sandboxTab
    : "preview";

  return (
    <EntityNumIdGate status={status} convexId={convexId}>
      {(sessionId) => (
        <SessionDetailClient
          sessionId={sessionId}
          activeSandboxTab={tab}
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
