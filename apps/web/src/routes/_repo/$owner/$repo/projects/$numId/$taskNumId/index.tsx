import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$numId/$taskNumId/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/projects/$numId/$taskNumId/$detailTab",
      params: {
        owner: params.owner,
        repo: params.repo,
        numId: params.numId,
        taskNumId: params.taskNumId,
        detailTab: "activity",
      },
    });
  },
});
