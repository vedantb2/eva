import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Doc } from "@eva/backend";
import {
  Button,
  PageHeader,
  PageHeaderActions,
  Switch,
  Tabs,
  TabsBar,
  TabsList,
  TabsTrigger,
} from "@eva/ui";
import { IconPlayerPlay } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { LatestRun, RunHistory } from "./_components/RunAccordion";
import { AutomationSettingsForm } from "./_components/AutomationSettingsForm";
import { useRepo } from "@/lib/contexts/RepoContext";
import { entityPathSegment } from "@/lib/numId";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";
import { isAutomationTab, type AutomationTab } from "@/lib/search-params";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

type Automation = Doc<"automations">;

interface AutomationClientProps {
  automation: Automation;
  repoOwner: string;
  repoName: string;
  activeTab: AutomationTab;
}

export function AutomationClient({
  automation,
  repoOwner,
  repoName,
  activeTab,
}: AutomationClientProps) {
  const navigate = useNavigate();
  const { basePath } = useRepo();
  const updateAutomation = useMutation(api.automations.update);
  const runNow = useMutation(api.automations.runNow);
  const runs = useQuery(api.automations.listRuns, {
    automationId: automation._id,
  });
  const hasActiveRun = runs?.some(
    (r) => r.status === "queued" || r.status === "running",
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader>
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <MarqueeOnHover className="min-w-0 text-2sm font-medium text-foreground">
            {automation.title}
          </MarqueeOnHover>
          <Switch
            checked={automation.enabled}
            onCheckedChange={(next) =>
              updateAutomation({ id: automation._id, enabled: next })
            }
          />
        </div>
        <PageHeaderActions>
          <Button
            size="sm"
            variant="outline"
            disabled={hasActiveRun === true || !automation.description}
            onClick={() => runNow({ automationId: automation._id })}
          >
            <IconPlayerPlay size={14} />
            Run Now
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            if (isAutomationTab(v)) {
              const segment = entityPathSegment(automation);
              if (!segment) return;
              navigate({
                to: toInternalRepoHref(
                  `${basePath}/automations/${segment}/${v}`,
                ),
              });
            }
          }}
        >
          <TabsBar className="px-0 pt-0">
            <TabsList>
              <TabsTrigger value="latest">Latest</TabsTrigger>
              <TabsTrigger value="run-history">Run History</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </TabsBar>
        </Tabs>

        {activeTab === "latest" && (
          <LatestRun
            run={runs?.[0]}
            loading={runs === undefined}
            actionsEnabled={automation.actionsEnabled === true}
            repoOwner={repoOwner}
            repoName={repoName}
          />
        )}

        {activeTab === "run-history" && (
          <RunHistory
            runs={runs?.slice(1)}
            actionsEnabled={automation.actionsEnabled === true}
            repoOwner={repoOwner}
            repoName={repoName}
          />
        )}

        {activeTab === "settings" && (
          <AutomationSettingsForm
            automation={automation}
            repoOwner={repoOwner}
            repoName={repoName}
          />
        )}
      </div>
    </div>
  );
}
