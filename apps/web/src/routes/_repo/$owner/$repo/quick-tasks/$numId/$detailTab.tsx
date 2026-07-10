import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  TASK_DETAIL_TABS,
  isTaskDetailTab,
} from "@/lib/components/tasks/_components/task-detail-constants";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/quick-tasks/$numId/$detailTab",
)({
  beforeLoad: ({ params }) => {
    if (!isTaskDetailTab(params.detailTab)) {
      throw redirect({
        to: "/$owner/$repo/quick-tasks/$numId/$detailTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          detailTab: TASK_DETAIL_TABS[0],
        },
        search: { draft: undefined },
      });
    }
  },
  component: () => null,
});
