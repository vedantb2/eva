import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_repo/$owner/$repo/testing-arena/$id/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/testing-arena/$id/$arenaTab",
      params: {
        owner: params.owner,
        repo: params.repo,
        id: params.id,
        arenaTab: "code",
      },
    });
  },
});
