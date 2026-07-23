import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useSessionByNumId } from "@/lib/useResolveByNumId";
import {
  isDiffView,
  isLegacyDesktopSandboxTab,
  isLegacyDiffsSandboxTab,
  isLegacyPrSandboxTab,
  isPrPanelTab,
  splitCorruptedSandboxTabParam,
} from "@/lib/search-params";
import { SessionDetailClient } from "../SessionDetailClient";

function redirectToReviewDiffs(args: {
  owner: string;
  repo: string;
  numId: string;
  diffView?: string;
  search: Record<string, unknown>;
  diffFile?: string;
}) {
  const diffView =
    args.diffView !== undefined && isDiffView(args.diffView)
      ? args.diffView
      : "diffView" in args.search &&
          typeof args.search.diffView === "string" &&
          isDiffView(args.search.diffView)
        ? args.search.diffView
        : "unified";

  throw redirect({
    to: "/$owner/$repo/sessions/$numId/review/diffs/$diffView",
    params: {
      owner: args.owner,
      repo: args.repo,
      numId: args.numId,
      diffView,
    },
    search: {
      ...args.search,
      prTab: undefined,
      diffView: undefined,
      ...(args.diffFile !== undefined ? { diffFile: args.diffFile } : {}),
    },
    replace: true,
  });
}

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/$sandboxTab",
)({
  beforeLoad: ({ params, search }) => {
    const corrupted = splitCorruptedSandboxTabParam(params.sandboxTab);
    if (corrupted) {
      if (
        isLegacyDiffsSandboxTab(corrupted.tab) ||
        isLegacyPrSandboxTab(corrupted.tab) ||
        corrupted.tab === "review"
      ) {
        redirectToReviewDiffs({
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          diffView: corrupted.diffView,
          diffFile: corrupted.diffFile,
          search: {},
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
      redirectToReviewDiffs({
        owner: params.owner,
        repo: params.repo,
        numId: params.numId,
        search,
      });
    }
    if (
      isLegacyPrSandboxTab(params.sandboxTab) ||
      params.sandboxTab === "review"
    ) {
      const fromSearch =
        "prTab" in search &&
        typeof search.prTab === "string" &&
        isPrPanelTab(search.prTab)
          ? search.prTab
          : "diffs";
      if (fromSearch === "overview") {
        throw redirect({
          to: "/$owner/$repo/sessions/$numId/review/overview",
          params: {
            owner: params.owner,
            repo: params.repo,
            numId: params.numId,
          },
          search: { ...search, prTab: undefined, diffView: undefined },
          replace: true,
        });
      }
      if (fromSearch === "recap") {
        throw redirect({
          to: "/$owner/$repo/sessions/$numId/review/recap",
          params: {
            owner: params.owner,
            repo: params.repo,
            numId: params.numId,
          },
          search: { ...search, prTab: undefined, diffView: undefined },
          replace: true,
        });
      }
      redirectToReviewDiffs({
        owner: params.owner,
        repo: params.repo,
        numId: params.numId,
        search,
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
          activeSandboxTab={sandboxTab}
          onSandboxTabChange={onSandboxTabChange}
          onOpenFile={openFile}
          onViewDiff={openDiffs}
        />
      )}
    </EntityNumIdGate>
  );
}
