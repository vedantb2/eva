import { createFileRoute, Navigate, redirect } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import {
  DOC_VIEWER_DEFAULT_TAB,
  isDocViewerTab,
  type DocViewerTab,
} from "@/lib/search-params";
import { DocViewer } from "@/lib/components/docs/DocViewer";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { useRepo } from "@/lib/contexts/RepoContext";
import { parseRouteNumId } from "@/lib/numId";
import { Spinner } from "@eva/ui";

export const Route = createFileRoute("/_repo/$owner/$repo/docs/$numId/$docTab")(
  {
    beforeLoad: ({ params }) => {
      if (!isDocViewerTab(params.docTab)) {
        throw redirect({
          to: "/$owner/$repo/docs/$numId/$docTab",
          params: {
            owner: params.owner,
            repo: params.repo,
            numId: params.numId,
            docTab: DOC_VIEWER_DEFAULT_TAB,
          },
          search: (prev) => prev,
        });
      }
    },
    component: DocDetailTabPage,
  },
);

function DocDetailTabPage() {
  const { owner, repo, numId, docTab } = Route.useParams();
  const { basePath, repoId } = useRepo();
  const parsedNumId = parseRouteNumId(numId);
  const doc = useQuery(
    api.docs.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  const tab: DocViewerTab = isDocViewerTab(docTab)
    ? docTab
    : DOC_VIEWER_DEFAULT_TAB;

  if (parsedNumId === null) {
    return (
      <EntityNotFound entityLabel="document" backTo={`${basePath}/docs`} />
    );
  }

  if (doc === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (doc === null) {
    return (
      <EntityNotFound entityLabel="document" backTo={`${basePath}/docs`} />
    );
  }

  // PR recaps moved to Reviews — keep old /docs/$numId links working.
  if (doc.kind === "pr-recap" && doc.prNumber !== undefined) {
    return (
      <Navigate
        to="/$owner/$repo/reviews/$prNumber/$reviewTab"
        params={{
          owner,
          repo,
          prNumber: String(doc.prNumber),
          reviewTab: "recap",
        }}
        search={(prev) => prev}
        replace
      />
    );
  }

  return <DocViewer doc={doc} activeTab={tab} />;
}
