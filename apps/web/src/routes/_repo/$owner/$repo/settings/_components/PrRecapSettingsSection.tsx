import { Switch } from "@eva/ui";
import { normalizeAIModel, type AIModel, type Id } from "@eva/backend";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { ConfigModelField } from "./ConfigModelField";

type UpdateRepoConfig = (args: {
  repoId: Id<"githubRepos">;
  prRecapsEnabled?: boolean;
  prRecapModel?: AIModel;
}) => void;

export function PrRecapSettingsSection({
  repoId,
  prRecapsEnabled,
  prRecapModel,
  updateConfig,
}: {
  repoId: Id<"githubRepos">;
  prRecapsEnabled: boolean | undefined;
  prRecapModel: string;
  updateConfig: UpdateRepoConfig;
}) {
  const prRecapModels = useAvailableAiModels(repoId, prRecapModel);
  const claudeAvailable = prRecapModels.options.some(
    (option) => option.provider === "claude",
  );

  return (
    <div className="space-y-4 border-t border-border pt-4">
      {/* Label left, switch right — the same toggle row shape used by the
          global notifications and sandbox settings. */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">PR recaps</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Auto-generate a recap doc and GitHub comment on each PR update. Uses
            your team Claude Code subscription (
            <code>CLAUDE_CODE_OAUTH_TOKEN</code>).
          </p>
          {!claudeAvailable ? (
            <p className="mt-1 text-xs text-destructive">
              Add CLAUDE_CODE_OAUTH_TOKEN in team env vars to enable.
            </p>
          ) : null}
        </div>
        <Switch
          checked={prRecapsEnabled ?? false}
          disabled={!claudeAvailable}
          onCheckedChange={(checked) =>
            updateConfig({ repoId, prRecapsEnabled: checked })
          }
          aria-label="PR recaps"
        />
      </div>

      <ConfigModelField
        label="PR Recap Model"
        description="Model used when generating PR recap documents."
        disabled={!claudeAvailable}
        state={prRecapModels}
        onValueChange={(nextModel) => {
          updateConfig({
            repoId,
            prRecapModel: normalizeAIModel(nextModel),
          });
        }}
      />
    </div>
  );
}
