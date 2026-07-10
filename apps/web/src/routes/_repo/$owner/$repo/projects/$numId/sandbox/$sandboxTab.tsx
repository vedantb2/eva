import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { Spinner } from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { parseRouteNumId } from "@/lib/numId";
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
  const { repoId } = useRepo();
  const parsedNumId = parseRouteNumId(numId);
  const project = useQuery(
    api.projects.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  const tab = isTaskRouteSandboxTab(sandboxTab) ? sandboxTab : "preview";

  if (parsedNumId === null) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Project not found
      </div>
    );
  }

  if (project === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Project not found
      </div>
    );
  }

  return (
    <ProjectDetailClient
      projectId={project._id}
      projectNumId={project.numId}
      surface="sandbox"
      sandboxTab={tab}
    />
  );
}
