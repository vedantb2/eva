import { createFileRoute, useParams, useRouterState } from "@tanstack/react-router";

import { useRepo } from "@/lib/contexts/RepoContext";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useProjectByNumId } from "@/lib/useResolveByNumId";
import {
  isTaskRouteSandboxTab,
  type TaskRouteSandboxTab,
} from "@/lib/search-params";
import { ProjectDetailClient } from "../../ProjectDetailClient";

/** Matches `/projects/$numId/sandbox/review…`. */
const PROJECT_SANDBOX_REVIEW_PATH =
  /\/projects\/[^/]+\/sandbox\/review(?:\/|$)/;

/**
 * Project sandbox shell. Kept mounted across `$sandboxTab` and `/review/…`
 * children so Preview iframes / Console survive tab switches.
 */
export const Route = createFileRoute(
  "/_repo/$owner/$repo/projects/$numId/sandbox",
)({
  component: ProjectSandboxLayout,
});

function useProjectSandboxTab(): TaskRouteSandboxTab {
  const params = useParams({ strict: false });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (PROJECT_SANDBOX_REVIEW_PATH.test(pathname)) {
    return "review";
  }

  const sandboxTab = params.sandboxTab;
  if (typeof sandboxTab === "string" && isTaskRouteSandboxTab(sandboxTab)) {
    return sandboxTab;
  }

  return "preview";
}

function ProjectSandboxLayout() {
  const { numId } = Route.useParams();
  const { basePath, repoId } = useRepo();
  const {
    status,
    convexId,
    numId: projectNumId,
  } = useProjectByNumId(numId, repoId);
  const sandboxTab = useProjectSandboxTab();

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
          sandboxTab={sandboxTab}
        />
      )}
    </EntityNumIdGate>
  );
}
