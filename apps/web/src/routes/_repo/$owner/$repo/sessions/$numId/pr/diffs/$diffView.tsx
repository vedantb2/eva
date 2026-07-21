import { createFileRoute, redirect } from "@tanstack/react-router";
import { isDiffView } from "@/lib/search-params";

/** Legacy `/pr/diffs/$diffView` → `/review/diffs/$diffView`. */
export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/pr/diffs/$diffView",
)({
  beforeLoad: ({ params, search }) => {
    const diffView = isDiffView(params.diffView) ? params.diffView : "unified";
    throw redirect({
      to: "/$owner/$repo/sessions/$numId/review/diffs/$diffView",
      params: {
        owner: params.owner,
        repo: params.repo,
        numId: params.numId,
        diffView,
      },
      search,
      replace: true,
    });
  },
});
