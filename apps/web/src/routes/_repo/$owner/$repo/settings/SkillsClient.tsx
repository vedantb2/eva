"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { SkillRow } from "./skills/_components/SkillRow";
import { Button } from "@conductor/ui";
import { IconRefresh } from "@tabler/icons-react";
import { useState } from "react";

export function SkillsClient() {
  const { repoId } = useRepo();
  const skills = useQuery(api.repoSkills.listByRepo, { repoId });
  const syncFromGithub = useAction(api.repoSkills.syncFromGithub);
  const [syncing, setSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!skills) return null;

  const availableSkills = skills.filter((skill) => skill.available);
  const staleSkills = skills.filter((skill) => !skill.available);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setError(null);
    setWarnings([]);
    setSyncSummary(null);
    try {
      const result = await syncFromGithub({ repoId });
      setWarnings(result.warnings);
      setSyncSummary(
        `${result.available} available, ${result.stale} stale, ${result.skipped} skipped.`,
      );
    } catch (syncError) {
      setError(
        syncError instanceof Error
          ? syncError.message
          : "Failed to sync skills from GitHub.",
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <PageWrapper
      title="Skills"
      comfortable
      headerRight={
        <Button size="sm" onClick={handleSync} disabled={syncing}>
          <IconRefresh size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : "Sync from GitHub"}
        </Button>
      }
    >
      <div className="rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4">
        <div>
          <h3 className="text-sm font-medium">Repo Skills</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Synced from <code>.agents/skills</code>. Type <code>/</code> in
            session, task, or project chat to invoke a harness skill.
          </p>
        </div>

        {syncSummary ? (
          <p className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {syncSummary}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}
        {warnings.length > 0 ? (
          <div className="rounded-md bg-muted/40 px-3 py-2">
            <p className="text-xs font-medium">Sync warnings</p>
            <div className="mt-1 grid gap-1 text-[11px] text-muted-foreground">
              {warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          </div>
        ) : null}

        {skills.length > 0 ? (
          <div className="grid gap-2">
            {availableSkills.map((skill) => (
              <SkillRow key={skill._id} skill={skill} />
            ))}
            {staleSkills.map((skill) => (
              <SkillRow key={skill._id} skill={skill} />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No skills synced yet.
          </p>
        )}
      </div>
    </PageWrapper>
  );
}
