import { useNavigate } from "@tanstack/react-router";

import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useSessionByNumId } from "@/lib/useResolveByNumId";
import { SessionDetailClient } from "../../SessionDetailClient";

/**
 * Shared session page for `/pr/recap` and `/pr/diffs/$diffView` — same shell,
 * PR sandbox tab active.
 */
export function SessionPrPage({ numId }: { numId: string }) {
  const navigate = useNavigate();
  const { basePath, repoId } = useRepo();
  const { status, convexId } = useSessionByNumId(numId, repoId);

  const openFile = (path: string) => {
    void navigate({
      to: `${basePath}/sessions/${numId}/files`,
      search: (prev) => ({ ...prev, file: path }),
    });
  };

  const openDiffs = (repoRelativePath?: string) => {
    void navigate({
      to: `${basePath}/sessions/${numId}/pr/diffs/unified`,
      search: (prev) => ({
        ...prev,
        ...(repoRelativePath ? { diffFile: repoRelativePath } : {}),
      }),
    });
  };

  const onSandboxTabChange = (next: string) => {
    if (next === "pr") {
      void navigate({
        to: `${basePath}/sessions/${numId}/pr/diffs/unified`,
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
          activeSandboxTab="pr"
          onSandboxTabChange={onSandboxTabChange}
          onOpenFile={openFile}
          onViewDiff={openDiffs}
        />
      )}
    </EntityNumIdGate>
  );
}
