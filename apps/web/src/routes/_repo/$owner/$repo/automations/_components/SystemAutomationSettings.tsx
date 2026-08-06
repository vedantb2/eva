import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Doc } from "@eva/backend";
import { Surface, toast } from "@eva/ui";
import { describeCron } from "@/lib/components/CronScheduleCard";
import { SettingToggle } from "./SettingToggle";

/**
 * Settings tab for a system automation: the definition is code-owned and shown
 * read-only, so the only writable setting here is the email delivery toggle.
 */
export function SystemAutomationSettings({
  automation,
}: {
  automation: Doc<"automations">;
}) {
  const updateAutomation = useMutation(api.automations.update);
  const schedule = describeCron(automation.cronSchedule);

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
          title="Send email"
          description="Email this automation's run summary to all users when a run succeeds"
          checked={automation.sendEmail === true}
          onChange={(next) => {
            void updateAutomation({ id: automation._id, sendEmail: next })
              .then(() => toast.success("Saved", { id: "automation-saved" }))
              .catch(() =>
                toast.error("Couldn't save changes", { id: "automation-saved" }),
              );
          }}
        />
      </Surface>

      <p className="text-[11px] text-muted-foreground">
        This automation is built into eva. Its title, prompt and schedule are
        managed by eva and cannot be edited here.
      </p>
    </div>
  );
}
