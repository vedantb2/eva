import { createFileRoute, redirect } from "@tanstack/react-router";
import { DOC_VIEWER_DEFAULT_TAB } from "@/lib/search-params";

export const Route = createFileRoute("/_repo/$owner/$repo/docs/$numId/")({
  beforeLoad: ({ params }) => {
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
  },
});
