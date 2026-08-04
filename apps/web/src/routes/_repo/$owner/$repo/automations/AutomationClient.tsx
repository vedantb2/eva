import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api, normalizeAIModel } from "@eva/backend";
import type { Doc } from "@eva/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { CronScheduleCard } from "@/lib/components/CronScheduleCard";
import {
  Button,
  Input,
  Tabs,
  TabsBar,
  TabsList,
  TabsTrigger,
  Textarea,
  cn,
  ModelSelect,
  toast,
  Surface,
} from "@eva/ui";
import { IconPlayerPlay, IconTrash } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { AutomationDeleteDialog } from "./_components/AutomationDeleteDialog";
import { SettingToggle } from "./_components/SettingToggle";
import { LatestRun, RunHistory } from "./_components/RunAccordion";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
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
    <PageWrapper
      comfortable
      title={
        <div className="flex items-center gap-2 sm:gap-3">
          <MarqueeOnHover className="min-w-0">
            {automation.title}
          </MarqueeOnHover>
          <button
            type="button"
            onClick={() =>
              updateAutomation({
                id: automation._id,
                enabled: !automation.enabled,
              })
            }
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              automation.enabled ? "bg-primary" : "bg-muted-foreground/30",
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-5 w-5 rounded-full bg-white transition-transform",
                automation.enabled ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
        </div>
      }
      headerRight={
        <Button
          size="sm"
          variant="outline"
          disabled={hasActiveRun === true || !automation.description}
          onClick={() => runNow({ automationId: automation._id })}
        >
          <IconPlayerPlay size={14} />
          Run Now
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
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
          <SettingsForm
            automation={automation}
            repoOwner={repoOwner}
            repoName={repoName}
          />
        )}
      </div>
    </PageWrapper>
  );
}

function SettingsForm({
  automation,
  repoOwner,
  repoName,
}: {
  automation: Automation;
  repoOwner: string;
  repoName: string;
}) {
  const { repo, repoId } = useRepo();
  const siblingApps = useQuery(api.githubRepos.listSiblingApps, {
    repoId,
  });
  const isMonorepo =
    repo.parentRepoId !== undefined || (siblingApps?.length ?? 0) > 0;

  const navigate = useNavigate();
  const updateAutomation = useMutation(
    api.automations.update,
  ).withOptimisticUpdate((localStore, args) => {
    if (automation.numId === undefined) return;
    const q = { repoId, numId: automation.numId };
    const current = localStore.getQuery(api.automations.getByNumId, q);
    if (current) {
      const { id: _id, contextRepoId: _contextRepoId, ...fields } = args;
      localStore.setQuery(api.automations.getByNumId, q, {
        ...current,
        ...fields,
      });
    }
  });
  const removeAutomation = useMutation(
    api.automations.remove,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.automations.list, { repoId });
    if (current !== undefined) {
      localStore.setQuery(
        api.automations.list,
        { repoId },
        current.filter((a) => a._id !== args.id),
      );
    }
  });
  // The cron input is a controlled field doing local↔UTC conversion with a
  // live preview, so it needs an editing buffer to save on blur rather than on
  // every keystroke. Every other field reads straight from the automation doc.
  const [cronDraft, setCronDraft] = useState(automation.cronSchedule);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const model = normalizeAIModel(automation.model ?? repo.defaultModel);
  const { options: modelOptions } = useAvailableAiModels(repoId, model);

  // Persist a single field change and confirm with one deduped toast.
  const commit = (
    fields: Omit<Parameters<typeof updateAutomation>[0], "id">,
  ) => {
    void updateAutomation({ id: automation._id, ...fields })
      .then(() => toast.success("Saved", { id: "automation-saved" }))
      .catch(() =>
        toast.error("Couldn't save changes", { id: "automation-saved" }),
      );
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeAutomation({ id: automation._id });
      navigate({
        to: "/$owner/$repo/automations",
        params: { owner: repoOwner, repo: repoName },
      });
    } catch (error) {
      setIsDeleting(false);
      throw error;
    }
    setIsDeleting(false);
  };

  return (
    <div className="space-y-4">
      <CronScheduleCard
        value={cronDraft}
        onChange={setCronDraft}
        onBlurCommit={(v) => {
          if (v !== automation.cronSchedule) commit({ cronSchedule: v });
        }}
      />

      <Surface density="none" className="p-3 space-y-4 sm:p-4">
        <h3 className="text-sm font-medium">Description</h3>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Title
          </label>
          <Input
            className="h-8 text-xs"
            placeholder="Automation title"
            defaultValue={automation.title}
            onBlur={(e) => {
              const val = e.target.value;
              if (val !== automation.title) commit({ title: val });
            }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Prompt
          </label>
          <Textarea
            className="min-h-[120px] text-xs"
            placeholder="Describe what this automation should do..."
            defaultValue={automation.description}
            onBlur={(e) => {
              const val = e.target.value;
              if (val !== automation.description) commit({ description: val });
            }}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            The prompt that will be executed on each run.
          </p>
        </div>
      </Surface>

      {isMonorepo && (
        <Surface density="none" className="p-3 sm:p-4">
          <SettingToggle
            title="Share across apps"
            description="Show and run this automation from every app in the monorepo"
            checked={automation.shared === true}
            onChange={(next) => commit({ contextRepoId: repoId, shared: next })}
          />
        </Surface>
      )}

      <Surface density="none" className="p-3 sm:p-4">
        <SettingToggle
          title="Report Only"
          description="Analyze and report without making code changes, branches, or PRs"
          checked={automation.readOnly === true}
          onChange={(next) =>
            commit(
              next
                ? { readOnly: true }
                : { readOnly: false, actionsEnabled: false },
            )
          }
        />
      </Surface>

      {automation.readOnly === true && (
        <Surface density="none" className="p-3 sm:p-4">
          <SettingToggle
            title="Actions"
            description="Parse findings into actionable items you can convert to tasks"
            checked={automation.actionsEnabled === true}
            onChange={(next) => commit({ actionsEnabled: next })}
          />
        </Surface>
      )}

      <Surface density="none" className="p-3 sm:p-4">
        <SettingToggle
          title="Send email"
          description="Email this automation's run summary to all users when a run succeeds"
          checked={automation.sendEmail === true}
          onChange={(next) => commit({ sendEmail: next })}
        />
      </Surface>

      <Surface density="none" className="p-3 space-y-4 sm:p-4">
        <h3 className="text-sm font-medium">Model</h3>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Provider and Model
          </label>
          <ModelSelect
            value={model}
            options={modelOptions}
            onValueChange={(m) => commit({ model: m })}
          />
        </div>
      </Surface>

      <Surface density="none" className="p-3 space-y-4 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-destructive">
              Delete Automation
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Permanently remove this automation and all its run history
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <IconTrash size={14} />
            Delete
          </Button>
        </div>
      </Surface>

      <AutomationDeleteDialog
        automation={
          showDeleteDialog
            ? { id: automation._id, title: automation.title }
            : null
        }
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
