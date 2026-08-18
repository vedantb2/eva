import {
  createFileRoute,
  Navigate,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import {
  isSimpleViewHiddenGlobalSettingsPath,
  useSimpleView,
} from "@/lib/hooks/useSimpleView";

export const Route = createFileRoute("/_global/settings")({
  component: GlobalSettingsLayout,
});

function GlobalSettingsLayout() {
  const simpleView = useSimpleView();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (simpleView && isSimpleViewHiddenGlobalSettingsPath(pathname)) {
    return <Navigate to="/settings/theme" replace />;
  }

  return <Outlet />;
}
