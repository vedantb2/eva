import { createFileRoute, redirect } from "@tanstack/react-router";
import { REVIEW_DEFAULT_TAB } from "@/lib/search-params";

export const Route = createFileRoute("/_repo/$owner/$repo/reviews/$prNumber/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/reviews/$prNumber/$reviewTab",
      params: {
        owner: params.owner,
        repo: params.repo,
        prNumber: params.prNumber,
        reviewTab: REVIEW_DEFAULT_TAB,
      },
      search: (prev) => prev,
    });
  },
});
