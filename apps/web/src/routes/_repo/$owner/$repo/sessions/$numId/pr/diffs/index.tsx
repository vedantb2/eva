import { createFileRoute, redirect } from "@tanstack/react-router";
import { isDiffView } from "@/lib/search-params";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$numId/pr/diffs/",
)({
  beforeLoad: ({ params, search }) => {
    const fromSearch =
      "diffView" in search &&
      typeof search.diffView === "string" &&
      isDiffView(search.diffView)
        ? search.diffView
        : "unified";
    throw redirect({
      to: "/$owner/$repo/sessions/$numId/pr/diffs/$diffView",
      params: {
        owner: params.owner,
        repo: params.repo,
        numId: params.numId,
        diffView: fromSearch,
      },
      search: (prev) => ({ ...prev, diffView: undefined, prTab: undefined }),
      replace: true,
    });
  },
});
