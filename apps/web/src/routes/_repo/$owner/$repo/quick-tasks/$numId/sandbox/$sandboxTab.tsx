import { createFileRoute, redirect } from "@tanstack/react-router";
import { isTaskRouteSandboxTab } from "@/lib/search-params";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/quick-tasks/$numId/sandbox/$sandboxTab",
)({
  beforeLoad: ({ params }) => {
    if (!isTaskRouteSandboxTab(params.sandboxTab)) {
      throw redirect({
        to: "/$owner/$repo/quick-tasks/$numId/sandbox/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          sandboxTab: "preview",
        },
        search: { draft: undefined },
      });
    }
  },
  component: () => null,
});
