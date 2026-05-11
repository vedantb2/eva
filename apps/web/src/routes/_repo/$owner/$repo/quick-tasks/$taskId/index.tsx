import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/quick-tasks/$taskId/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/quick-tasks/$taskId/$detailTab",
      params: {
        owner: params.owner,
        repo: params.repo,
        taskId: params.taskId,
        detailTab: "activity",
      },
    });
  },
});
