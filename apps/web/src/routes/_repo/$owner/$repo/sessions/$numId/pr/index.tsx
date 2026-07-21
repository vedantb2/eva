import { createFileRoute, redirect } from "@tanstack/react-router";
import { isPrPanelTab } from "@/lib/search-params";

export const Route = createFileRoute("/_repo/$owner/$repo/sessions/$numId/pr/")(
  {
    beforeLoad: ({ params, search }) => {
      const fromSearch =
        "prTab" in search &&
        typeof search.prTab === "string" &&
        isPrPanelTab(search.prTab)
          ? search.prTab
          : "diffs";
      throw redirect({
        to: "/$owner/$repo/sessions/$numId/pr/$prSubTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          prSubTab: fromSearch,
        },
        search: (prev) => ({ ...prev, prTab: undefined }),
        replace: true,
      });
    },
  },
);
