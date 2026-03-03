"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button, Spinner } from "@conductor/ui";
import { BranchSelect } from "@/lib/components/BranchSelect";

export function ConfigClient() {
  const { repo, repoId } = useRepo();
  const updateConfig = useMutation(api.githubRepos.updateConfig);

  const [defaultBaseBranch, setDefaultBaseBranch] = useState(
    repo.defaultBaseBranch ?? "main",
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDefaultBaseBranch(repo.defaultBaseBranch ?? "main");
  }, [repo._id, repo.defaultBaseBranch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig({
        repoId,
        defaultBaseBranch: defaultBaseBranch || undefined,
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
