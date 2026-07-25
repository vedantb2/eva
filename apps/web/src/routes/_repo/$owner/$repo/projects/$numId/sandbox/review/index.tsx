import { createFileRoute, redirect } from "@tanstack/react-router";
import { reviewPathFromSearch } from "@/lib/search-params";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$numId/sandbox/review/",
)({
  beforeLoad: ({ params, search }) => {
    const dest = reviewPathFromSearch(search);
    if (dest.kind === "overview") {
      throw redirect({
        to: "/$owner/$repo/projects/$numId/sandbox/review/overview",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
        },
        search: (prev) => ({
          ...prev,
          prTab: undefined,
          diffView: undefined,
        }),
        replace: true,
      });
    }
    if (dest.kind === "recap") {
      throw redirect({
        to: "/$owner/$repo/projects/$numId/sandbox/review/recap",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
        },
        search: (prev) => ({
          ...prev,
          prTab: undefined,
          diffView: undefined,
        }),
        replace: true,
      });
    }
    throw redirect({
      to: "/$owner/$repo/projects/$numId/sandbox/review/diffs/$diffView",
      params: {
        owner: params.owner,
        repo: params.repo,
        numId: params.numId,
        diffView: dest.diffView,
      },
      search: (prev) => ({ ...prev, prTab: undefined, diffView: undefined }),
      replace: true,
    });
  },
});
