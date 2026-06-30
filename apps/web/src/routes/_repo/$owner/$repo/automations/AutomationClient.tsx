import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api, normalizeAIModel, type AIModel } from "@conductor/backend";
import type { Doc } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { CronScheduleCard } from "@/lib/components/CronScheduleCard";
import {
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  Spinner,
  cn,
  ModelSelect,
} from "@conductor/ui";
import { IconPlayerPlay, IconTrash } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { AutomationDeleteDialog } from "./_components/AutomationDeleteDialog";
import { SettingToggle } from "./_components/SettingToggle";
import { LatestRun, RunHistory } from "./_components/RunAccordion";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { useRepo } from "@/lib/contexts/RepoContext";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";
import { isAutomationTab, type AutomationTab } from "@/lib/search-params";

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
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          if (isAutomationTab(v)) {
            navigate({ to: `${basePath}/automations/${automation._id}/${v}` });
          }
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="latest">Latest</TabsTrigger>
          <TabsTrigger value="run-history">Run History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
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
  const updateAutomation = useMutation(api.automations.update);
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
  const [title, setTitle] = useState(automation.title);
  const [description, setDescription] = useState(automation.description);
  const [cronSchedule, setCronSchedule] = useState(automation.cronSchedule);
  const savedModel = normalizeAIModel(automation.model ?? repo.defaultModel);
  const [model, setModel] = useState<AIModel>(savedModel);
  const [readOnly, setReadOnly] = useState(automation.readOnly === true);
  const [actionsEnabled, setActionsEnabled] = useState(
    automation.actionsEnabled === true,
  );
  const [shared, setShared] = useState(automation.shared === true);
  const [sendEmail, setSendEmail] = useState(automation.sendEmail === true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { options: modelOptions } = useAvailableAiModels(repoId, model);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeAutomation({ id: automation._id });
      navigate({
        to: "/$owner/$repo/automations",
        params: { owner: repoOwner, repo: repoName },
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasChanges =
    title !== automation.title ||
    description !== automation.description ||
    cronSchedule !== automation.cronSchedule ||
    model !== savedModel ||
    readOnly !== (automation.readOnly === true) ||
    actionsEnabled !== (automation.actionsEnabled === true) ||
    shared !== (automation.shared === true) ||
    sendEmail !== (automation.sendEmail === true);

  const sharedChanged = shared !== (automation.shared === true);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAutomation({
        id: automation._id,
        ...(isMonorepo && sharedChanged
          ? { contextRepoId: repoId, shared }
          : {}),
        title,
        description,
        cronSchedule,
        model,
        readOnly,
        actionsEnabled: readOnly ? actionsEnabled : false,
        sendEmail,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <CronScheduleCard value={cronSchedule} onChange={setCronSchedule} />

      <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
        <h3 className="text-sm font-medium">Description</h3>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Title
          </label>
          <Input
            className="h-8 text-xs"
            placeholder="Automation title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Prompt
          </label>
          <Textarea
            className="min-h-[120px] text-xs"
            placeholder="Describe what this automation should do..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            The prompt that will be executed on each run.
          </p>
        </div>
      </div>

      {isMonorepo && (
        <div className="rounded-surface border border-border bg-card p-3 sm:p-4">
          <SettingToggle
            title="Share across apps"
            description="Show and run this automation from every app in the monorepo"
            checked={shared}
            onChange={setShared}
          />
        </div>
      )}

      <div className="rounded-surface border border-border bg-card p-3 sm:p-4">
        <SettingToggle
          title="Report Only"
          description="Analyze and report without making code changes, branches, or PRs"
          checked={readOnly}
          onChange={setReadOnly}
        />
      </div>

      {readOnly && (
        <div className="rounded-surface border border-border bg-card p-3 sm:p-4">
          <SettingToggle
            title="Actions"
            description="Parse findings into actionable items you can convert to tasks"
            checked={actionsEnabled}
            onChange={setActionsEnabled}
          />
        </div>
      )}

      <div className="rounded-surface border border-border bg-card p-3 sm:p-4">
        <SettingToggle
          title="Send email"
          description="Email this automation's run summary to all users when a run succeeds"
          checked={sendEmail}
          onChange={setSendEmail}
        />
      </div>

      <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
        <h3 className="text-sm font-medium">Model</h3>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Provider and Model
          </label>
          <ModelSelect
            value={model}
            options={modelOptions}
            onValueChange={setModel}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving && <Spinner size="sm" />}
          Save
        </Button>
      </div>

      <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
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
      </div>

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
