import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useProjectByNumId } from "@/lib/useResolveByNumId";
import { ProjectDetailClient } from "../../../ProjectDetailClient";

/** Shared project page for `/sandbox/review/overview`, `/sandbox/review/recap`, and `/sandbox/review/diffs/$diffView`. */
export function ProjectSandboxReviewPage({ numId }: { numId: string }) {
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
          surface="sandbox"
          sandboxTab="review"
        />
      )}
    </EntityNumIdGate>
  );
}
