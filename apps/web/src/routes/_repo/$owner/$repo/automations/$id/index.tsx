import { createFileRoute, redirect } from "@tanstack/react-router";
import { AUTOMATION_DEFAULT_TAB } from "@/lib/search-params";

export const Route = createFileRoute("/_repo/$owner/$repo/automations/$id/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$owner/$repo/automations/$id/$automationTab",
      params: {
        owner: params.owner,
        repo: params.repo,
        id: params.id,
        automationTab: AUTOMATION_DEFAULT_TAB,
      },
    });
  },
});
