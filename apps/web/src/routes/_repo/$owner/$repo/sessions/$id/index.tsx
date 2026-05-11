import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_repo/$owner/$repo/sessions/$id/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/sessions/$id/$sandboxTab",
      params: {
        owner: params.owner,
        repo: params.repo,
        id: params.id,
        sandboxTab: "preview",
      },
    });
  },
});
