import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_repo/$owner/$repo/sessions/$numId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/sessions/$numId/$sandboxTab",
      params: {
        owner: params.owner,
        repo: params.repo,
        numId: params.numId,
        sandboxTab: "preview",
      },
    });
  },
});
