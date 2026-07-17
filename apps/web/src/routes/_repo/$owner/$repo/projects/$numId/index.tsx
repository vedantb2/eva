import { createFileRoute } from "@tanstack/react-router";
import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useProjectByNumId } from "@/lib/useResolveByNumId";
import { ProjectDetailClient } from "../ProjectDetailClient";

export const Route = createFileRoute("/_repo/$owner/$repo/projects/$numId/")({
  component: ProjectDetailIndex,
});

function ProjectDetailIndex() {
  const { numId } = Route.useParams();
  const { basePath, repoId } = useRepo();
  const {
    status,
    convexId,
    numId: projectNumId,
  } = useProjectByNumId(numId, repoId);

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
          surface="main"
        />
      )}
    </EntityNumIdGate>
  );
}
