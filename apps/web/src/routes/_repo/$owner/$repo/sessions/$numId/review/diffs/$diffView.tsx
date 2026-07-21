import { createFileRoute, redirect } from "@tanstack/react-router";
import { isDiffView } from "@/lib/search-params";
import { SessionReviewPage } from "../-SessionReviewPage";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/review/diffs/$diffView",
)({
  beforeLoad: ({ params, search }) => {
    if (!isDiffView(params.diffView)) {
      const fromSearch =
        "diffView" in search &&
        typeof search.diffView === "string" &&
        isDiffView(search.diffView)
          ? search.diffView
          : "unified";
      throw redirect({
        to: "/$owner/$repo/sessions/$numId/review/diffs/$diffView",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          diffView: fromSearch,
        },
        search: (prev) => ({ ...prev, diffView: undefined, prTab: undefined }),
        replace: true,
      });
    }
  },
  component: SessionReviewDiffViewRoute,
});

function SessionReviewDiffViewRoute() {
  const { numId } = Route.useParams();
  return <SessionReviewPage numId={numId} />;
}
