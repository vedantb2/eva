import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useSessionByNumId } from "@/lib/useResolveByNumId";
import { isPrPanelTab } from "@/lib/search-params";
import { SessionDetailClient } from "../../SessionDetailClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/pr/$prSubTab",
)({
  beforeLoad: ({ params, search }) => {
    if (!isPrPanelTab(params.prSubTab)) {
      const fromSearch =
        "prTab" in search &&
        typeof search.prTab === "string" &&
        isPrPanelTab(search.prTab)
          ? search.prTab
          : "diffs";
      throw redirect({
        to: "/$owner/$repo/sessions/$numId/pr/$prSubTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          prSubTab: fromSearch,
        },
        search: (prev) => ({ ...prev, prTab: undefined }),
        replace: true,
      });
    }
  },
  component: SessionPrSubTabRoute,
});

function SessionPrSubTabRoute() {
  const { numId } = Route.useParams();
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
      to: `${basePath}/sessions/${numId}/pr/diffs`,
      search: (prev) => ({
        ...prev,
        ...(repoRelativePath ? { diffFile: repoRelativePath } : {}),
      }),
    });
  };

  const onSandboxTabChange = (next: string) => {
    if (next === "pr") {
      void navigate({
        to: `${basePath}/sessions/${numId}/pr/diffs`,
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
