import { createFileRoute, redirect } from "@tanstack/react-router";
import { AUTOMATION_DEFAULT_TAB } from "@/lib/search-params";

export const Route = createFileRoute("/_repo/$owner/$repo/automations/$numId/")(
  {
    beforeLoad: ({ params }) => {
      throw redirect({
        to: "/$owner/$repo/automations/$numId/$automationTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          automationTab: AUTOMATION_DEFAULT_TAB,
        },
      });
    },
  },
);
