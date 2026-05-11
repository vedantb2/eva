import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/snapshots/")(
  {
    beforeLoad: ({ params }) => {
      throw redirect({
        to: "/$owner/$repo/settings/snapshots/$snapTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          snapTab: "configuration",
        },
      });
    },
  },
);
