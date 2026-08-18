import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useSimpleView } from "@/lib/hooks/useSimpleView";

export const Route = createFileRoute("/_repo/$owner/$repo/automations")({
  component: AutomationsLayout,
});

function AutomationsLayout() {
  const simpleView = useSimpleView();
  const { owner, repo } = Route.useParams();

  if (simpleView) {
    return (
      <Navigate
        to="/$owner/$repo/projects"
        params={{ owner, repo }}
        replace
      />
    );
  }

  return <Outlet />;
}
