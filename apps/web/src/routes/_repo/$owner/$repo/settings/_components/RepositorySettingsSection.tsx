"use client";

import { normalizeAIModel, type AIModel, type Id } from "@eva/backend";
import { FALLBACK_GIT_BASE_BRANCH } from "@eva/shared";
import { Switch } from "@eva/ui";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsField } from "@/lib/components/settings/SettingsField";
import { SettingsToggleRow } from "@/lib/components/settings/SettingsToggleRow";
import { ConfigModelField } from "./ConfigModelField";

type RepoConfigFields = {
  defaultBaseBranch?: string;
  defaultModel?: string;
  auditReviewModel?: string;
  auditFixModel?: string;
  proofModel?: string;
  prRecapsEnabled?: boolean;
  prRecapModel?: string;
};

type UpdateRepoConfig = (args: {
  repoId: Id<"githubRepos">;
  defaultBaseBranch?: string;
  defaultModel?: AIModel;
  auditReviewModel?: AIModel;
  auditFixModel?: AIModel;
  proofModel?: AIModel;
  prRecapsEnabled?: boolean;
  prRecapModel?: AIModel;
}) => void;

export function RepositorySettingsSection({
  repoId,
  owner,
  name,
  repo,
  isMonorepo,
  updateConfig,
}: {
  repoId: Id<"githubRepos">;
  owner: string;
  name: string;
  repo: RepoConfigFields;
  isMonorepo: boolean;
  updateConfig: UpdateRepoConfig;
}) {
  const defaultModels = useAvailableAiModels(repoId, repo.defaultModel);
  const auditReviewModels = useAvailableAiModels(
    repoId,
    repo.auditReviewModel ?? "haiku",
  );
  const auditFixModels = useAvailableAiModels(
    repoId,
    repo.auditFixModel ?? "sonnet",
  );
  const proofModels = useAvailableAiModels(
    repoId,
    repo.proofModel ?? repo.defaultModel ?? "sonnet",
  );
  const prRecapModels = useAvailableAiModels(
    repoId,
    repo.prRecapModel ?? repo.defaultModel ?? "sonnet",
  );
  const claudeAvailable = prRecapModels.options.some(
    (option) => option.provider === "claude",
  );
  const prRecapsOn = (repo.prRecapsEnabled ?? false) && claudeAvailable;

  const monorepoHint = isMonorepo ? (
    <>
      Applies to every app in{" "}
      <span className="font-medium text-foreground">
        {owner}/{name}
      </span>
      .
    </>
  ) : undefined;

  return (
    <>
      <SettingsSection title="Defaults" description={monorepoHint}>
        <div className="grid gap-4">
          <SettingsField
            label="Base branch"
            description="Used when creating quick tasks. Falls back to main."
          >
            <BranchSelect
              value={repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH}
              onValueChange={(val) =>
                updateConfig({ repoId, defaultBaseBranch: val || undefined })
              }
              className="h-9"
              placeholder="Select a branch"
            />
          </SettingsField>

          <ConfigModelField
            label="Default model"
            description="Provider and model for new tasks."
            state={defaultModels}
            onValueChange={(nextModel) => {
              updateConfig({
                repoId,
                defaultModel: normalizeAIModel(nextModel),
              });
            }}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Audits"
        description="Models used when reviewing and fixing work."
      >
        <div className="grid gap-4">
          <ConfigModelField
            label="Review"
            description="Reads changes during an audit. Haiku by default."
            state={auditReviewModels}
            onValueChange={(nextModel) => {
              updateConfig({
                repoId,
                auditReviewModel: normalizeAIModel(nextModel),
              });
            }}
          />

          <ConfigModelField
            label="Fix"
            description="Applies fixes found in an audit. Sonnet by default."
            state={auditFixModels}
            onValueChange={(nextModel) => {
              updateConfig({
                repoId,
                auditFixModel: normalizeAIModel(nextModel),
              });
            }}
          />

          <ConfigModelField
            label="Proof capture"
            description="Post-implementation screenshots and videos. Uses the task model when unset."
            state={proofModels}
            onValueChange={(nextModel) => {
              updateConfig({
                repoId,
                proofModel: normalizeAIModel(nextModel),
              });
            }}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="PR recaps"
        description="Recap doc and GitHub comment on each PR update. Needs team Claude Code OAuth."
        bodyVariant="list"
      >
        <div className="divide-y divide-border">
          <SettingsToggleRow
            title="Enabled"
            description={
              claudeAvailable
                ? "Uses your team CLAUDE_CODE_OAUTH_TOKEN."
                : "Add CLAUDE_CODE_OAUTH_TOKEN in team env vars first."
            }
            action={
              <Switch
                checked={repo.prRecapsEnabled ?? false}
                disabled={!claudeAvailable}
                onCheckedChange={(checked) =>
                  updateConfig({ repoId, prRecapsEnabled: checked })
                }
                aria-label="PR recaps"
              />
            }
          />
          {prRecapsOn ? (
            <div className="px-4 py-3">
              <ConfigModelField
                label="Recap model"
                description="Model used to write the recap."
                state={prRecapModels}
                onValueChange={(nextModel) => {
                  updateConfig({
                    repoId,
                    prRecapModel: normalizeAIModel(nextModel),
                  });
                }}
              />
            </div>
          ) : null}
        </div>
      </SettingsSection>
    </>
  );
}
