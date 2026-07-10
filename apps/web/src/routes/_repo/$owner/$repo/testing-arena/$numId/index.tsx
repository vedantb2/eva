import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/testing-arena/$numId/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/testing-arena/$numId/$arenaTab",
      params: {
        owner: params.owner,
        repo: params.repo,
        numId: params.numId,
        arenaTab: "code",
      },
    });
  },
});
