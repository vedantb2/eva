import { createFileRoute, redirect } from "@tanstack/react-router";
import { QuickTaskSandboxClient } from "../../QuickTaskSandboxClient";
import { isTaskRouteSandboxTab } from "@/lib/search-params";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/quick-tasks/$taskId/sandbox/$sandboxTab",
)({
  beforeLoad: ({ params }) => {
    if (!isTaskRouteSandboxTab(params.sandboxTab)) {
      throw redirect({
        to: "/$owner/$repo/quick-tasks/$taskId/sandbox/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          taskId: params.taskId,
          sandboxTab: "preview",
        },
      });
    }
  },
  component: QuickTaskSandboxRoute,
});

function QuickTaskSandboxRoute() {
  const { taskId, sandboxTab } = Route.useParams();
  if (!isTaskRouteSandboxTab(sandboxTab)) {
    return null;
  }
  return <QuickTaskSandboxClient taskId={taskId} sandboxTab={sandboxTab} />;
}
