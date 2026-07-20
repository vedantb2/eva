import { createFileRoute, redirect } from "@tanstack/react-router";

// The repo root no longer renders a stats page; those stats now live as a
// compact summary at the bottom of the sidebar. Land on Sessions instead.
export const Route = createFileRoute("/_repo/$owner/$repo/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/sessions",
      params: { owner: params.owner, repo: params.repo },
    });
  },
});
