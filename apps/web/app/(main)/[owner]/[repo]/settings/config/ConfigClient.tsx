"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api, CLAUDE_MODELS, type ClaudeModel } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Button,
  Spinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@conductor/ui";
import { BranchSelect } from "@/lib/components/BranchSelect";

export function ConfigClient() {
  const { repo, repoId } = useRepo();
  const updateConfig = useMutation(api.githubRepos.updateConfig);

  const [defaultBaseBranch, setDefaultBaseBranch] = useState(
    repo.defaultBaseBranch ?? "main",
  );
  const [defaultModel, setDefaultModel] = useState<ClaudeModel>(
    repo.defaultModel ?? "sonnet",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDefaultBaseBranch(repo.defaultBaseBranch ?? "main");
    setDefaultModel(repo.defaultModel ?? "sonnet");
  }, [repo._id, repo.defaultBaseBranch, repo.defaultModel]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig({
        repoId,
        defaultBaseBranch: defaultBaseBranch || undefined,
        defaultModel,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper title="Config">
      <div className="rounded-lg border border-border/70 p-4 space-y-4">
        <h3 className="text-sm font-medium">Repository Configuration</h3>

        <div className="grid gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Default Base Branch
            </label>
            <BranchSelect
              value={defaultBaseBranch}
              onValueChange={setDefaultBaseBranch}
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
              value={defaultModel}
              onValueChange={(val) => {
                const model = CLAUDE_MODELS.find((m) => m === val);
                if (model) setDefaultModel(model);
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

        <div className="flex justify-end pt-2 border-t border-border/40">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" className="mr-1.5" /> : null}
            Save
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
