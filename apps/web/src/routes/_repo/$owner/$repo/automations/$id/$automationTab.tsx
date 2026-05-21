import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Spinner } from "@conductor/ui";
import {
  AUTOMATION_DEFAULT_TAB,
  isAutomationTab,
  type AutomationTab,
} from "@/lib/search-params";
import { AutomationClient } from "../AutomationClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/automations/$id/$automationTab",
)({
  beforeLoad: ({ params }) => {
    if (!isAutomationTab(params.automationTab)) {
      throw redirect({
        to: "/$owner/$repo/automations/$id/$automationTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          id: params.id,
          automationTab: AUTOMATION_DEFAULT_TAB,
        },
      });
    }
  },
  component: AutomationDetailTabRoute,
});

function AutomationDetailTabRoute() {
  const { id, owner, repo, automationTab } = Route.useParams();
  const activeTab: AutomationTab = isAutomationTab(automationTab)
    ? automationTab
    : AUTOMATION_DEFAULT_TAB;
  const automation = useQuery(api.automations.get, {
    id: id as Id<"automations">,
  });

  if (automation === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (automation === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <p>Automation not found</p>
      </div>
    );
  }

  return (
    <AutomationClient
      key={automation._id}
      automation={automation}
      repoOwner={owner}
      repoName={repo}
      activeTab={activeTab}
    />
  );
}
