import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { Spinner } from "@eva/ui";
import {
  AUTOMATION_DEFAULT_TAB,
  isAutomationTab,
  type AutomationTab,
} from "@/lib/search-params";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { useRepo } from "@/lib/contexts/RepoContext";
import { parseRouteNumId } from "@/lib/numId";
import { AutomationClient } from "../AutomationClient";

export const Route = createFileRoute(
  "/_repo/$owner/$repo/automations/$numId/$automationTab",
)({
  beforeLoad: ({ params }) => {
    if (!isAutomationTab(params.automationTab)) {
      throw redirect({
        to: "/$owner/$repo/automations/$numId/$automationTab",
        params: {
          owner: params.owner,
          repo: params.repo,
          numId: params.numId,
          automationTab: AUTOMATION_DEFAULT_TAB,
        },
      });
    }
  },
  component: AutomationDetailTabRoute,
});

function AutomationDetailTabRoute() {
  const { numId, owner, repo, automationTab } = Route.useParams();
  const { basePath, repoId } = useRepo();
  const parsedNumId = parseRouteNumId(numId);
  const automation = useQuery(
    api.automations.getByNumId,
    parsedNumId !== null ? { repoId, numId: parsedNumId } : "skip",
  );
  const activeTab: AutomationTab = isAutomationTab(automationTab)
    ? automationTab
    : AUTOMATION_DEFAULT_TAB;

  if (parsedNumId === null) {
    return (
      <EntityNotFound
        entityLabel="automation"
        backTo={`${basePath}/automations`}
      />
    );
  }

  if (automation === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (automation === null) {
    return (
      <EntityNotFound
        entityLabel="automation"
        backTo={`${basePath}/automations`}
      />
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
