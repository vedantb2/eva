import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AUTOMATION_DEFAULT_TAB,
  isAutomationTab,
  type AutomationTab,
} from "@/lib/search-params";
import { EntityNumIdGate } from "@/lib/components/EntityNumIdGate";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useAutomationByNumId } from "@/lib/useResolveByNumId";
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
  const resolve = useAutomationByNumId(numId, repoId);
  const activeTab: AutomationTab = isAutomationTab(automationTab)
    ? automationTab
    : AUTOMATION_DEFAULT_TAB;

  return (
    <EntityNumIdGate
      resolve={resolve}
      entityLabel="automation"
      backTo={`${basePath}/automations`}
    >
      {(automation) => (
        <AutomationClient
          key={automation._id}
          automation={automation}
          repoOwner={owner}
          repoName={repo}
          activeTab={activeTab}
        />
      )}
    </EntityNumIdGate>
  );
}
