import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SessionDetailClient } from "../SessionDetailClient";
import { isSessionSandboxTab, type SandboxTab } from "@/lib/search-params";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/sessions/$id/$sandboxTab",
)({
  beforeLoad: ({ params }) => {
    if (!isSessionSandboxTab(params.sandboxTab)) {
      throw redirect({
        to: "/$owner/$repo/sessions/$id/$sandboxTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          id: params.id,
          sandboxTab: "preview",
        },
      });
    }
  },
  component: SessionSandboxRoute,
});

function SessionSandboxRoute() {
  const { id, sandboxTab } = Route.useParams();
  const navigate = useNavigate();
  const { basePath } = useRepo();

  const tab: SandboxTab = isSessionSandboxTab(sandboxTab)
    ? sandboxTab
    : "preview";

  return (
    <SessionDetailClient
      sessionId={id}
      activeSandboxTab={tab}
      onSandboxTabChange={(next) => {
        navigate({
          to: `${basePath}/sessions/${id}/${next}`,
        });
      }}
    />
  );
}
