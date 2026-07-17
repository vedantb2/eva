import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useSessionByNumId } from "@/lib/useResolveByNumId";
import { SessionDetailClient } from "../SessionDetailClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/$sandboxTab",
)({
  component: SessionSandboxRoute,
});

// The tab segment is a builtin SandboxTab or a custom tab's name slug (e.g.
// "supabase"). Custom slugs can't be validated synchronously here (they live
// in Convex), so the raw segment is passed through and SandboxPanel falls back
// to "preview" if it resolves to no known tab.
function SessionSandboxRoute() {
  const { numId, sandboxTab } = Route.useParams();
  const navigate = useNavigate();
  const { basePath, repoId } = useRepo();
  const { status, convexId } = useSessionByNumId(numId, repoId);

  // Opening a file from a chat chip both switches to the Files tab and sets the
  // `?file=` param the File Viewer reads. Stable so the memoised activity
  // renderer that ultimately calls it is not invalidated each render.
  const openFile = useCallback(
    (path: string) => {
      void navigate({
        to: `${basePath}/sessions/${numId}/files`,
        search: (prev) => ({ ...prev, file: path }),
      });
    },
    [navigate, basePath, numId],
  );

  return (
    <EntityNumIdGate
      status={status}
      convexId={convexId}
      entityLabel="session"
      backTo={`${basePath}/sessions`}
    >
      {(sessionId) => (
        <SessionDetailClient
          sessionId={sessionId}
          activeSandboxTab={sandboxTab}
          onSandboxTabChange={(next) => {
            navigate({
              to: `${basePath}/sessions/${numId}/${next}`,
            });
          }}
          onOpenFile={openFile}
        />
      )}
    </EntityNumIdGate>
  );
}
