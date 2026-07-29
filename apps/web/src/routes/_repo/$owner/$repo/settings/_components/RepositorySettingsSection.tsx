"use client";

import { normalizeAIModel, type AIModel, type Id } from "@eva/backend";
import { FALLBACK_GIT_BASE_BRANCH } from "@eva/shared";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { useAvailableAiModels } from "@/lib/hooks/useAvailableAiModels";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsField } from "@/lib/components/settings/SettingsField";
import { ConfigModelField } from "./ConfigModelField";
import { PrRecapSettingsSection } from "./PrRecapSettingsSection";

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

  return (
    <SettingsSection
      title="Repository"
      description={
        isMonorepo ? (
          <>
            Applies to all apps in{" "}
            <span className="font-medium text-foreground">
              {owner}/{name}
            </span>
            .
          </>
        ) : undefined
      }
    >
      <div className="grid gap-4">
        <SettingsField
          label="Default Base Branch"
          description={
            <>
              The default branch used when creating quick tasks. Defaults to{" "}
              <code>main</code> if not set.
            </>
          }
        >
          <BranchSelect
            value={repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH}
            onValueChange={(val) =>
              updateConfig({ repoId, defaultBaseBranch: val || undefined })
            }
            className="h-8 text-xs"
            placeholder="Select a branch"
          />
        </SettingsField>

        <ConfigModelField
          label="Default Model"
          description="The default provider and model used when creating new tasks."
          state={defaultModels}
          onValueChange={(nextModel) => {
            updateConfig({
              repoId,
              defaultModel: normalizeAIModel(nextModel),
            });
          }}
        />

        <ConfigModelField
          label="Audit Review Model"
          description="Used to review task and session changes during an audit. Defaults to Haiku for fast, cheap review."
          state={auditReviewModels}
          onValueChange={(nextModel) => {
            updateConfig({
              repoId,
              auditReviewModel: normalizeAIModel(nextModel),
            });
          }}
        />

        <ConfigModelField
          label="Audit Fix Model"
          description="Used to fix issues found during an audit. Defaults to Sonnet for stronger code generation."
          state={auditFixModels}
          onValueChange={(nextModel) => {
            updateConfig({
              repoId,
              auditFixModel: normalizeAIModel(nextModel),
            });
          }}
        />

        <ConfigModelField
          label="Proof Capture Model"
          description="Used for the post-implementation proof step when screenshots/videos are enabled. Defaults to the task model when unset."
          state={proofModels}
          onValueChange={(nextModel) => {
            updateConfig({
              repoId,
              proofModel: normalizeAIModel(nextModel),
            });
          }}
        />

        <PrRecapSettingsSection
          repoId={repoId}
          prRecapsEnabled={repo.prRecapsEnabled}
          prRecapModel={repo.prRecapModel ?? repo.defaultModel ?? "sonnet"}
          updateConfig={updateConfig}
        />
      </div>
    </SettingsSection>
  );
}
