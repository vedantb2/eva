import { Switch, Textarea } from "@eva/ui";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsField } from "@/lib/components/settings/SettingsField";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { CronScheduleCard } from "@/lib/components/CronScheduleCard";
import { RebuildRequiredWarning } from "../../_components/RebuildRequiredWarning";
import type { RepoSnapshot } from "../_utils";

/** Every command box on this page is a monospace, resizable textarea. */
const COMMAND_TEXTAREA_CLASS = "resize-y bg-background font-mono text-xs";

/** Schedule, branch, and build/seed command config for a repo's snapshot. */
export function ConfigurationTab({
  snapshot,
  schedule,
  workflowRef,
  buildCommandsText,
  seedCommandsText,
  isEnabled,
  onScheduleChange,
  onBranchChange,
  onBuildCommandsBlur,
  onSeedCommandsBlur,
  onEnabledChange,
}: {
  snapshot: RepoSnapshot | null;
  schedule: string;
  workflowRef: string;
  buildCommandsText: string;
  seedCommandsText: string;
  isEnabled: boolean;
  onScheduleChange: (schedule: string) => void;
  onBranchChange: (branch: string) => void;
  onBuildCommandsBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onSeedCommandsBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onEnabledChange: (enabled: boolean) => void;
}) {
  return (
    <>
      <CronScheduleCard value={schedule} onChange={onScheduleChange} allowManual />

      <SettingsSection
        title="Branch"
        description="When disabled, scheduled rebuilds are paused. Manual rebuilds still work."
        action={
          snapshot ? (
            <Switch
              checked={isEnabled}
              onCheckedChange={onEnabledChange}
              aria-label="Scheduled rebuilds enabled"
            />
          ) : null
        }
      >
        <SettingsField
          label="Branch"
          description={
            <>
              Branch to clone for the snapshot. Defaults to <code>main</code>
              if empty.
            </>
          }
        >
          <BranchSelect
            value={workflowRef}
            onValueChange={onBranchChange}
            className="h-8 text-xs"
            placeholder="Select a branch"
          />
        </SettingsField>
      </SettingsSection>

      {snapshot && <RebuildRequiredWarning />}

      <SettingsSection title="Build Commands">
        <SettingsField
          label="Commands to run during snapshot build"
          description={
            <>
              One command per line. Runs in <code>/tmp/repo</code> after{" "}
              <code>pnpm install</code> and before services start. Use for
              codegen and builds.
            </>
          }
        >
          <Textarea
            key={`build-${snapshot?._id ?? "none"}`}
            defaultValue={buildCommandsText}
            onBlur={onBuildCommandsBlur}
            className={`h-48 ${COMMAND_TEXTAREA_CLASS}`}
            placeholder="pnpm convex codegen&#10;pnpm build"
          />
        </SettingsField>
      </SettingsSection>

      <SettingsSection title="Seed Commands">
        <SettingsField
          label="One-time data seeding, run with services up"
          description={
            <>
              One command per line. Runs once per seeded build after services
              start. Unlike startup commands, these do not run on every
              sandbox boot.
            </>
          }
        >
          <Textarea
            key={`seed-${snapshot?._id ?? "none"}`}
            defaultValue={seedCommandsText}
            onBlur={onSeedCommandsBlur}
            className={`h-48 ${COMMAND_TEXTAREA_CLASS}`}
            placeholder="cd packages/backend && npx convex env set MY_KEY 'value'&#10;cd packages/backend && npx convex import seed.zip --yes"
          />
        </SettingsField>
      </SettingsSection>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Requires Vercel Sandbox credentials in team or repo environment
        variables: <code className="font-mono">VERCEL_TOKEN</code>,{" "}
        <code className="font-mono">VERCEL_TEAM_ID</code>, and{" "}
        <code className="font-mono">VERCEL_PROJECT_ID</code>.
      </p>
    </>
  );
}
