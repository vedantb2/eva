import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@eva/backend";
import type { Doc } from "@eva/backend";
import { Button, Surface, toast } from "@eva/ui";
import { describeCron } from "@/lib/components/CronScheduleCard";
import { useRepo } from "@/lib/contexts/RepoContext";
import { SettingToggle } from "./SettingToggle";

/**
 * Settings tab for an installed system automation: the definition is code-owned
 * and shown read-only, so the only writable settings are the install-level
 * toggles plus uninstalling it from this app.
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
  const schedule = describeCron(automation.cronSchedule);

  const commit = (fields: { enabled?: boolean; sendEmail?: boolean }) => {
    void updateAutomation({ id: automation._id, ...fields })
      .then(() => toast.success("Saved", { id: "automation-saved" }))
      .catch(() =>
        toast.error("Couldn't save changes", { id: "automation-saved" }),
      );
  };

  return (
    <div className="space-y-4">
      <Surface density="none" className="p-3 space-y-2 sm:p-4">
        <h3 className="text-sm font-medium">Schedule</h3>
        <p className="text-xs text-muted-foreground">
          {schedule.valid ? schedule.text : "No schedule"}
        </p>
        <code className="text-[11px] text-muted-foreground">
          {automation.cronSchedule} (UTC)
        </code>
      </Surface>

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

      <Surface density="none" className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">Uninstall</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Remove this automation from the app. Reinstalling it from the
              Automations Hub brings its run history back.
            </p>
          </div>
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
        </div>
      </Surface>

      <p className="text-[11px] text-muted-foreground">
        This automation is built into eva. Its title, prompt and schedule are
        managed by eva and cannot be edited here.
      </p>
    </div>
  );
}
