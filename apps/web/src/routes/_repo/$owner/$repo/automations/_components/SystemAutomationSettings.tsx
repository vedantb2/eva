import { useState } from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@eva/backend";
import type { Doc } from "@eva/backend";
import { Button, Switch, toast } from "@eva/ui";
import { CronScheduleCard } from "@/lib/components/CronScheduleCard";
import { SettingsStack } from "@/lib/components/settings/SettingsStack";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsToggleRow } from "@/lib/components/settings/SettingsToggleRow";
import { useRepo } from "@/lib/contexts/RepoContext";

/**
 * Settings tab for an installed system automation. eva owns the title, prompt
 * and mode; the schedule and the install-level toggles belong to the user, as
 * does uninstalling it from this app.
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
  const { repoId } = useRepo();
  const navigate = useNavigate();
  const updateAutomation = useMutation(api.automations.update);
  const uninstall = useMutation(api.automations.uninstallSystemAutomation);
  // Mirrors SettingsForm: the cron field is controlled with a live local-time
  // preview, so it needs an editing buffer and saves on blur.
  const [cronDraft, setCronDraft] = useState(automation.cronSchedule);

  const commit = (fields: {
    enabled?: boolean;
    sendEmail?: boolean;
    cronSchedule?: string;
  }) => {
    void updateAutomation({ id: automation._id, ...fields })
      .then(() => toast.success("Saved", { id: "automation-saved" }))
      .catch(() =>
        toast.error("Couldn't save changes", { id: "automation-saved" }),
      );
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

      <SettingsSection title="Prompt">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {automation.description}
        </p>
      </SettingsSection>

      <SettingsSection title="Behaviour" bodyVariant="list">
        <SettingsToggleRow
          title="Enabled"
          description="Run this automation on its schedule for this app."
          action={
            <Switch
              checked={automation.enabled}
              onCheckedChange={(next) => commit({ enabled: next })}
              aria-label="Enabled"
            />
          }
        />
        <SettingsToggleRow
          title="Send email"
          description="Email this automation's run summary to all users when a run succeeds."
          action={
            <Switch
              checked={automation.sendEmail === true}
              onCheckedChange={(next) => commit({ sendEmail: next })}
              aria-label="Send email"
            />
          }
        />
      </SettingsSection>

      <SettingsSection
        title="Uninstall"
        description="Remove this automation from the app. Reinstalling it from the Automations Hub brings its run history back."
        bodyVariant="compact"
        bodyClassName="flex justify-end"
      >
        <Button
          variant="destructive"
          size="sm"
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
      </SettingsSection>

      <p className="px-4 text-xs leading-relaxed text-muted-foreground">
        This automation is built into eva. Its title, prompt and report-only
        mode are managed by eva; the schedule is yours to change.
      </p>
    </SettingsStack>
  );
}
