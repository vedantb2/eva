import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_repo/$owner/$repo/quick-tasks/$numId/")(
  {
    beforeLoad: ({ params }) => {
      throw redirect({
        to: "/$owner/$repo/quick-tasks/$numId/$detailTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          detailTab: "activity",
        },
        search: { draft: undefined },
      });
    },
  },
);
