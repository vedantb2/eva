import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$projectId/$taskId/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/projects/$projectId/$taskId/$detailTab",
      params: {
        owner: params.owner,
        repo: params.repo,
        projectId: params.projectId,
        taskId: params.taskId,
        detailTab: "activity",
      },
    });
  },
});
