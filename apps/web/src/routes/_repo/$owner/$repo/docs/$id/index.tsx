import { createFileRoute, redirect } from "@tanstack/react-router";
import { DOC_VIEWER_DEFAULT_TAB } from "@/lib/search-params";

export const Route = createFileRoute("/_repo/$owner/$repo/docs/$id/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/docs/$id/$docTab",
      params: {
        owner: params.owner,
        repo: params.repo,
        id: params.id,
        docTab: DOC_VIEWER_DEFAULT_TAB,
      },
    });
  },
});
