import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProjectDetailClient } from "../../ProjectDetailClient";
import { isTaskRouteSandboxTab } from "@/lib/search-params";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$projectId/sandbox/$sandboxTab",
)({
  beforeLoad: ({ params }) => {
    if (!isTaskRouteSandboxTab(params.sandboxTab)) {
      throw redirect({
        to: "/$owner/$repo/projects/$projectId/sandbox/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          projectId: params.projectId,
          sandboxTab: "preview",
        },
      });
    }
  },
  component: ProjectSandboxRoute,
});

function ProjectSandboxRoute() {
  const { projectId, sandboxTab } = Route.useParams();
  const tab = isTaskRouteSandboxTab(sandboxTab) ? sandboxTab : "preview";
  return (
    <ProjectDetailClient
      projectId={projectId}
      surface="sandbox"
      sandboxTab={tab}
    />
  );
}
