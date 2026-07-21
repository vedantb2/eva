import { createFileRoute, redirect } from "@tanstack/react-router";
import { reviewPathFromSearch } from "@/lib/search-params";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/quick-tasks/$numId/sandbox/review/",
)({
  beforeLoad: ({ params, search }) => {
    const dest = reviewPathFromSearch(search);
    const diffFile =
      "diffFile" in search && typeof search.diffFile === "string"
        ? search.diffFile
        : undefined;
    if (dest.kind === "recap") {
      throw redirect({
        to: "/$owner/$repo/quick-tasks/$numId/sandbox/review/recap",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
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
    throw redirect({
      to: "/$owner/$repo/quick-tasks/$numId/sandbox/review/diffs/$diffView",
      params: {
        owner: params.owner,
        repo: params.repo,
        numId: params.numId,
        diffView: dest.diffView,
      },
      search: {
        draft: undefined,
        diffFile,
        diffView: undefined,
        prTab: undefined,
      },
      replace: true,
    });
  },
});
