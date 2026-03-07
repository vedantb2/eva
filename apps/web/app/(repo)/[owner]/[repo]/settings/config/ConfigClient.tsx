"use client";

import { useMutation } from "convex/react";
import { api, CLAUDE_MODELS } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from "@conductor/ui";
import { BranchSelect } from "@/lib/components/BranchSelect";

export function ConfigClient() {
  const { repo, repoId } = useRepo();
  const updateConfig = useMutation(api.githubRepos.updateConfig);

  return (
    <PageWrapper title="Config">
      <div className="space-y-4">
        <div className="rounded-lg border border-border/70 p-4 space-y-4">
          <h3 className="text-sm font-medium">Repository Configuration</h3>

          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Default Base Branch
              </label>
              <BranchSelect
                value={repo.defaultBaseBranch ?? "main"}
                onValueChange={(val) =>
                  updateConfig({ repoId, defaultBaseBranch: val || undefined })
                }
                className="h-8 text-xs"
                placeholder="Select a branch"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                The default branch used when creating quick tasks. Defaults to{" "}
                <code>main</code> if not set.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Default Model
              </label>
              <Select
                value={repo.defaultModel ?? "sonnet"}
                onValueChange={(val) => {
                  const model = CLAUDE_MODELS.find((m) => m === val);
                  if (model) updateConfig({ repoId, defaultModel: model });
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLAUDE_MODELS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                The default model used when creating new tasks. Defaults to{" "}
                <code>Sonnet</code> if not set.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/70 p-4 space-y-4">
          <h3 className="text-sm font-medium">Feature Toggles</h3>
          <div className="grid gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={repo.postAuditEnabled !== false}
                onCheckedChange={(checked) =>
                  updateConfig({ repoId, postAuditEnabled: checked === true })
                }
              />
              <div>
                <p className="text-xs font-medium">Post-execution Audit</p>
                <p className="text-[11px] text-muted-foreground">
                  Run an automated code audit after each task completes.
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={repo.sessionsVncEnabled !== false}
                onCheckedChange={(checked) =>
                  updateConfig({ repoId, sessionsVncEnabled: checked === true })
                }
              />
              <div>
                <p className="text-xs font-medium">Sessions Desktop (VNC)</p>
                <p className="text-[11px] text-muted-foreground">
                  Enable the desktop tab in sessions for VNC access.
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={repo.sessionsVscodeEnabled !== false}
                onCheckedChange={(checked) =>
                  updateConfig({
                    repoId,
                    sessionsVscodeEnabled: checked === true,
                  })
                }
              />
              <div>
                <p className="text-xs font-medium">Sessions Editor (VSCode)</p>
                <p className="text-[11px] text-muted-foreground">
                  Enable the code editor tab in sessions.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
