import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_repo/$owner/$repo/settings/")({
  component: SettingsRedirect,
});

function SettingsRedirect() {
  const navigate = useNavigate();
  const { owner, repo } = Route.useParams();
  useEffect(() => {
    navigate({
      to: "/_repo/$owner/$repo/settings/config",
      params: { owner, repo },
      replace: true,
    });
  }, [navigate, owner, repo]);
  return null;
}
