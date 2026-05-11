import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/settings/env-variables/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/settings/env-variables/$scope",
      params: {
        owner: params.owner,
        repo: params.repo,
        scope: "repo",
      },
    });
  },
});
