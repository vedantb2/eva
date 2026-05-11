import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import {
  DOC_VIEWER_DEFAULT_TAB,
  isDocViewerTab,
  type DocViewerTab,
} from "@/lib/search-params";
import { DocViewer } from "@/lib/components/docs/DocViewer";
import { Spinner } from "@conductor/ui";

export const Route = createFileRoute("/_repo/$owner/$repo/docs/$id/$docTab")({
  beforeLoad: ({ params }) => {
    if (!isDocViewerTab(params.docTab)) {
      throw redirect({
        to: "/$owner/$repo/docs/$id/$docTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          id: params.id,
          docTab: DOC_VIEWER_DEFAULT_TAB,
        },
      });
    }
  },
  component: DocDetailTabPage,
});

function DocDetailTabPage() {
  const { id, docTab } = Route.useParams();
  const tab: DocViewerTab = isDocViewerTab(docTab)
    ? docTab
    : DOC_VIEWER_DEFAULT_TAB;
  const doc = useQuery(api.docs.get, { id: id as Id<"docs"> });

  if (doc === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <p>Document not found</p>
      </div>
    );
  }

  return <DocViewer doc={doc} activeTab={tab} />;
}
