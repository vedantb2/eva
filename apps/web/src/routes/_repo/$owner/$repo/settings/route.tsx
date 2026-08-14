import {
  createFileRoute,
  Navigate,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import {
  isSimpleViewHiddenSettingsPath,
  useSimpleView,
} from "@/lib/hooks/useSimpleView";

export const Route = createFileRoute("/_repo/$owner/$repo/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  const simpleView = useSimpleView();
  const { owner, repo } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (simpleView && isSimpleViewHiddenSettingsPath(pathname)) {
    return (
      <Navigate
        to="/$owner/$repo/settings/skills"
        params={{ owner, repo }}
        replace
      />
    );
  }

  return <Outlet />;
}
