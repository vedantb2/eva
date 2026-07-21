import { createFileRoute, redirect } from "@tanstack/react-router";
import { isDiffView, reviewPathFromSearch } from "@/lib/search-params";

/** Matched for params; parent quick-tasks layout renders the task. */
export const Route = createFileRoute(
  "/_repo/$owner/$repo/quick-tasks/$numId/sandbox/review/diffs/$diffView",
)({
  beforeLoad: ({ params, search }) => {
    if (!isDiffView(params.diffView)) {
      const dest = reviewPathFromSearch(search);
      const diffView = dest.kind === "diffs" ? dest.diffView : "unified";
      const diffFile =
        "diffFile" in search && typeof search.diffFile === "string"
          ? search.diffFile
          : undefined;
      throw redirect({
        to: "/$owner/$repo/quick-tasks/$numId/sandbox/review/diffs/$diffView",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          diffView,
        },
        search: {
          draft: undefined,
          diffFile,
          diffView: undefined,
          prTab: undefined,
        },
        replace: true,
      });
    }
  },
  component: () => null,
});
