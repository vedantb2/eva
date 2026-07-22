import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useSessionByNumId } from "@/lib/useResolveByNumId";
import { SessionDetailClient } from "../SessionDetailClient";
import { useSessionRouteSandboxTab } from "./_utils/useSessionRouteSandboxTab";

/**
 * Session detail shell. Kept mounted across `$sandboxTab` and `/review/…` child
 * routes so Preview iframes, Console PTY, Editor, etc. survive tab switches
 * (including Preview ↔ Review). Children only run beforeLoad redirects.
 */
export const Route = createFileRoute("/_repo/$owner/$repo/sessions/$numId")({
  component: SessionNumIdLayout,
});

function SessionNumIdLayout() {
  const { numId } = Route.useParams();
  const navigate = useNavigate();
  const { basePath, repoId } = useRepo();
  const { status, convexId } = useSessionByNumId(numId, repoId);
  const activeSandboxTab = useSessionRouteSandboxTab();

  const openFile = (path: string) => {
    void navigate({
      to: `${basePath}/sessions/${numId}/files`,
      search: (prev) => ({ ...prev, file: path }),
    });
  };

  const openDiffs = (repoRelativePath?: string) => {
    void navigate({
      to: `${basePath}/sessions/${numId}/review/diffs/unified`,
      search: (prev) => ({
        ...prev,
        ...(repoRelativePath ? { diffFile: repoRelativePath } : {}),
      }),
    });
  };

  const onSandboxTabChange = (next: string) => {
    if (next === "review") {
      void navigate({
        to: `${basePath}/sessions/${numId}/review/diffs/unified`,
        search: true,
      });
      return;
    }
    void navigate({
      to: `${basePath}/sessions/${numId}/${next}`,
      search: true,
    });
  };

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
          activeSandboxTab={activeSandboxTab}
          onSandboxTabChange={onSandboxTabChange}
          onOpenFile={openFile}
          onViewDiff={openDiffs}
        />
      )}
    </EntityNumIdGate>
  );
}
