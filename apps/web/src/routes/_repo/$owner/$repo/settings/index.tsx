import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSimpleView } from "@/lib/hooks/useSimpleView";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/")({
  component: SettingsRedirect,
});

function SettingsRedirect() {
  const simpleView = useSimpleView();
  const { owner, repo } = Route.useParams();
  return (
    <Navigate
      to={
        simpleView
          ? "/$owner/$repo/settings/skills"
          : "/$owner/$repo/settings/config"
      }
      params={{ owner, repo }}
      replace
    />
  );
}
