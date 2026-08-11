import { createFileRoute, redirect } from "@tanstack/react-router";
import { isTaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$numId/$taskNumId/$detailTab",
)({
  beforeLoad: ({ params }) => {
    if (!isTaskDetailTab(params.detailTab)) {
      throw redirect({
        to: "/$owner/$repo/projects/$numId/$taskNumId/$detailTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          detailTab: "activity",
          taskNumId: params.taskNumId,
        },
      });
    }
  },
  // Shell is rendered by the `$numId` layout so the task list and header stay
  // mounted while switching between tasks.
  component: () => null,
});
