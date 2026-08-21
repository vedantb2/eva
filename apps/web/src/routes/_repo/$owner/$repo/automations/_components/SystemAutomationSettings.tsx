import { useState } from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api, normalizeAIModel } from "@eva/backend";
import type { Doc } from "@eva/backend";
import { Button, ModelSelect, Surface, toast } from "@eva/ui";
import { CronScheduleCard } from "@/lib/components/CronScheduleCard";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { SettingToggle } from "./SettingToggle";

/**
 * Settings tab for an installed system automation. eva owns the title, prompt
 * and mode; the schedule, model and the install-level toggles belong to the
 * user, as does uninstalling it from this app.
 */
export function SystemAutomationSettings({
  automation,
  systemKey,
  repoOwner,
  repoName,
}: {
  automation: Doc<"automations">;
  systemKey: string;
  repoOwner: string;
  repoName: string;
}) {
  const { repo, repoId } = useRepo();
  const navigate = useNavigate();
  const updateAutomation = useMutation(api.automations.update);
  const uninstall = useMutation(api.automations.uninstallSystemAutomation);
  // Mirrors SettingsForm: the cron field is controlled with a live local-time
  // preview, so it needs an editing buffer and saves on blur.
  const [cronDraft, setCronDraft] = useState(automation.cronSchedule);
  const model = normalizeAIModel(automation.model ?? repo.defaultModel);
  const { options: modelOptions } = useAvailableAiModels(repoId, model);

  const commit = (
    fields: Omit<Parameters<typeof updateAutomation>[0], "id">,
  ) => {
    void updateAutomation({ id: automation._id, ...fields })
      .then(() => toast.success("Saved", { id: "automation-saved" }))
      .catch(() =>
        toast.error("Couldn't save changes", { id: "automation-saved" }),
      );
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

      <Surface density="none" className="p-3 space-y-2 sm:p-4">
        <h3 className="text-sm font-medium">Prompt</h3>
        <p className="whitespace-pre-wrap text-xs text-muted-foreground">
          {automation.description}
        </p>
      </Surface>

      <Surface density="none" className="p-3 sm:p-4">
        <SettingToggle
          title="Enabled"
          description="Run this automation on its schedule for this app"
          checked={automation.enabled}
          onChange={(next) => commit({ enabled: next })}
        />
      </Surface>

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
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Provider and Model
          </p>
          <ModelSelect
            value={model}
            options={modelOptions}
            onValueChange={(m) => commit({ model: m })}
          />
        </div>
      </Surface>

      <Surface density="none" className="p-3 sm:p-4">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-sm:min-w-0">
            <h3 className="text-sm font-medium">Uninstall</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Remove this automation from the app. Reinstalling it from the
              Automations Hub brings its run history back.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="max-sm:shrink-0"
            onClick={() => {
              void uninstall({ repoId, key: systemKey })
                .then(() =>
                  navigate({
                    to: "/$owner/$repo/automations",
                    params: { owner: repoOwner, repo: repoName },
                  }),
                )
                .catch(() =>
                  toast.error("Couldn't uninstall automation", {
                    id: "automation-saved",
                  }),
                );
            }}
          >
            Uninstall
          </Button>
        </div>
      </Surface>

      <p className="text-[11px] text-muted-foreground">
        This automation is built into eva. Its title, prompt and report-only
        mode are managed by eva; the schedule and model are yours to change.
      </p>
    </div>
  );
}
