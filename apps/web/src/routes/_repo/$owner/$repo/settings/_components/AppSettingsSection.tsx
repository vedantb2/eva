"use client";

import { Checkbox, Input } from "@conductor/ui";
import type { Id } from "@conductor/backend";
import { isAppRepo } from "../_utils";
import { DomainsSection } from "./DomainsSection";

type UpdateRepoConfig = (args: {
  repoId: Id<"githubRepos">;
  screenshotsVideosEnabled?: boolean;
  deploymentProjectName?: string;
  domains?: string[];
}) => void;

export function AppSettingsSection({
  repoId,
  appLabel,
  repo,
  updateConfig,
}: {
  repoId: Id<"githubRepos">;
  appLabel: string;
  repo: {
    rootDirectory?: string;
    screenshotsVideosEnabled?: boolean;
    deploymentProjectName?: string;
    domains?: string[];
  };
  updateConfig: UpdateRepoConfig;
}) {
  return (
    <div className="rounded-surface border border-border bg-card p-3 space-y-4 sm:p-4">
      <div>
        <h3 className="text-sm font-medium">This app</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Settings for{" "}
          <span className="font-medium text-foreground">{appLabel}</span> only.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={repo.screenshotsVideosEnabled ?? false}
            onCheckedChange={(value) =>
              updateConfig({
                repoId,
                screenshotsVideosEnabled: value === true,
              })
            }
            className="mt-0.5"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium">Screenshots and Videos</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Use agent browser to record walkthroughs, verify its work, etc.
            </p>
          </div>
        </div>

        {isAppRepo(repo) ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Deployment Project Name
            </label>
            <Input
              className="h-8 text-xs"
              placeholder="e.g. my-vercel-project"
              defaultValue={repo.deploymentProjectName ?? ""}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val !== (repo.deploymentProjectName ?? "")) {
                  updateConfig({
                    repoId,
                    deploymentProjectName: val || undefined,
                  });
                }
              }}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Vercel or Netlify project name for this app. Used to match the
              correct preview deployment in monorepos.
            </p>
          </div>
        ) : null}

        <DomainsSection
          repoId={repoId}
          domains={repo.domains ?? []}
          updateConfig={updateConfig}
        />
      </div>
    </div>
  );
}
