import { createFileRoute, redirect } from "@tanstack/react-router";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useProjectByNumId } from "@/lib/useResolveByNumId";
import { isTaskRouteSandboxTab } from "@/lib/search-params";
import { ProjectDetailClient } from "../../ProjectDetailClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$numId/sandbox/$sandboxTab",
)({
  beforeLoad: ({ params }) => {
    if (!isTaskRouteSandboxTab(params.sandboxTab)) {
      throw redirect({
        to: "/$owner/$repo/projects/$numId/sandbox/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          sandboxTab: "preview",
        },
      });
    }
  },
  component: ProjectSandboxRoute,
});

function ProjectSandboxRoute() {
  const { numId, sandboxTab } = Route.useParams();
  const { basePath, repoId } = useRepo();
  const {
    status,
    convexId,
    numId: projectNumId,
  } = useProjectByNumId(numId, repoId);
  const tab = isTaskRouteSandboxTab(sandboxTab) ? sandboxTab : "preview";

  return (
    <EntityNumIdGate
      status={status}
      convexId={convexId}
      entityLabel="project"
      backTo={`${basePath}/projects`}
    >
      {(projectId) => (
        <ProjectDetailClient
          projectId={projectId}
          projectNumId={projectNumId ?? undefined}
          surface="sandbox"
          sandboxTab={tab}
        />
      )}
    </EntityNumIdGate>
  );
}
