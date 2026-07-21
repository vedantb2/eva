import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useSessionByNumId } from "@/lib/useResolveByNumId";
import {
  isLegacyDesktopSandboxTab,
  isLegacyDiffsSandboxTab,
  isPrPanelTab,
  splitCorruptedSandboxTabParam,
} from "@/lib/search-params";
import { SessionDetailClient } from "../SessionDetailClient";

function stripPrTabSearch<T extends Record<string, unknown>>(
  prev: T,
): T & { prTab: undefined } {
  return { ...prev, prTab: undefined };
}

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/$sandboxTab",
)({
  beforeLoad: ({ params, search }) => {
    const corrupted = splitCorruptedSandboxTabParam(params.sandboxTab);
    if (corrupted) {
      if (isLegacyDiffsSandboxTab(corrupted.tab) || corrupted.tab === "pr") {
        throw redirect({
          to: "/$owner/$repo/sessions/$numId/pr/$prSubTab",
          params: {
            owner: params.owner,
            repo: params.repo,
            numId: params.numId,
            prSubTab: "diffs",
          },
          search: {
            diffFile: corrupted.diffFile,
            diffView: corrupted.diffView,
          },
          replace: true,
        });
      }
      const sandboxTab = isLegacyDesktopSandboxTab(corrupted.tab)
        ? "computer"
        : corrupted.tab;
      throw redirect({
        to: "/$owner/$repo/sessions/$numId/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          sandboxTab,
        },
        search: {
          diffFile: corrupted.diffFile,
          diffView: corrupted.diffView,
        },
        replace: true,
      });
    }
    if (isLegacyDesktopSandboxTab(params.sandboxTab)) {
      throw redirect({
        to: "/$owner/$repo/sessions/$numId/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          sandboxTab: "computer",
        },
        replace: true,
      });
    }
    if (isLegacyDiffsSandboxTab(params.sandboxTab)) {
      throw redirect({
        to: "/$owner/$repo/sessions/$numId/pr/$prSubTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          prSubTab: "diffs",
        },
        search: stripPrTabSearch(search),
        replace: true,
      });
    }
    if (params.sandboxTab === "pr") {
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
        search: stripPrTabSearch(search),
        replace: true,
      });
    }
  },
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
      // Keep diffFile/diffView (and other search) across sandbox tabs.
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
          activeSandboxTab={sandboxTab}
          onSandboxTabChange={onSandboxTabChange}
          onOpenFile={openFile}
          onViewDiff={openDiffs}
        />
      )}
    </EntityNumIdGate>
  );
}
