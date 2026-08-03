import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api, normalizeAIModel } from "@eva/backend";
import type { Doc } from "@eva/backend";
import { Button, Input, Textarea, ModelSelect, toast, Switch } from "@eva/ui";
import { IconTrash } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { CronScheduleCard } from "@/lib/components/CronScheduleCard";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsToggleRow } from "@/lib/components/settings/SettingsToggleRow";
import { SettingsField } from "@/lib/components/settings/SettingsField";
import { SettingsStack } from "@/lib/components/settings/SettingsStack";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { useRepo } from "@/lib/contexts/RepoContext";
import { AutomationDeleteDialog } from "./AutomationDeleteDialog";

type Automation = Doc<"automations">;

interface AutomationSettingsFormProps {
  automation: Automation;
  repoOwner: string;
  repoName: string;
}

/**
 * The Settings tab body for an automation: schedule, description, the
 * per-automation toggles (share/report-only/actions/send-email), model
 * choice, and delete. Extracted from `AutomationClient` so that route
 * component stays a thin orchestrator.
 */
export function AutomationSettingsForm({
  automation,
  repoOwner,
  repoName,
}: AutomationSettingsFormProps) {
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
    <SettingsStack>
      <CronScheduleCard
        value={cronDraft}
        onChange={setCronDraft}
        onBlurCommit={(v) => {
          if (v !== automation.cronSchedule) commit({ cronSchedule: v });
        }}
      />

      <SettingsSection title="Description">
        <SettingsField label="Title">
          <Input
            className="h-8 text-xs"
            placeholder="Automation title"
            defaultValue={automation.title}
            onBlur={(e) => {
              const val = e.target.value;
              if (val !== automation.title) commit({ title: val });
            }}
          />
        </SettingsField>
        <SettingsField
          label="Prompt"
          description="The prompt that will be executed on each run."
        >
          <Textarea
            className="min-h-[120px] text-xs"
            placeholder="Describe what this automation should do..."
            defaultValue={automation.description}
            onBlur={(e) => {
              const val = e.target.value;
              if (val !== automation.description) commit({ description: val });
            }}
          />
        </SettingsField>
      </SettingsSection>

      <SettingsSection
        title="Behaviour"
        bodyVariant="list"
        bodyClassName="divide-y divide-border"
      >
        {isMonorepo && (
          <SettingsToggleRow
            title="Share across apps"
            description="Show and run this automation from every app in the monorepo"
            action={
              <Switch
                checked={automation.shared === true}
                onCheckedChange={(next) =>
                  commit({ contextRepoId: repoId, shared: next })
                }
              />
            }
          />
        )}
        <SettingsToggleRow
          title="Report Only"
          description="Analyze and report without making code changes, branches, or PRs"
          action={
            <Switch
              checked={automation.readOnly === true}
              onCheckedChange={(next) =>
                commit(
                  next
                    ? { readOnly: true }
                    : { readOnly: false, actionsEnabled: false },
                )
              }
            />
          }
        />
        {automation.readOnly === true && (
          <SettingsToggleRow
            title="Actions"
            description="Parse findings into actionable items you can convert to tasks"
            action={
              <Switch
                checked={automation.actionsEnabled === true}
                onCheckedChange={(next) => commit({ actionsEnabled: next })}
              />
            }
          />
        )}
        <SettingsToggleRow
          title="Send email"
          description="Email this automation's run summary to all users when a run succeeds"
          action={
            <Switch
              checked={automation.sendEmail === true}
              onCheckedChange={(next) => commit({ sendEmail: next })}
            />
          }
        />
      </SettingsSection>

      <SettingsSection title="Model">
        <SettingsField label="Provider and Model">
          <ModelSelect
            value={model}
            options={modelOptions}
            onValueChange={(m) => commit({ model: m })}
          />
        </SettingsField>
      </SettingsSection>

      <SettingsSection
        title={<span className="text-destructive">Delete Automation</span>}
        description="Permanently remove this automation and all its run history"
        action={
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <IconTrash size={14} />
            Delete
          </Button>
        }
      />

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
    </SettingsStack>
  );
}
