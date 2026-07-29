"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { SkillRow } from "./skills/_components/SkillRow";
import { Button } from "@eva/ui";
import { IconRefresh, IconSparkles } from "@tabler/icons-react";
import { useState } from "react";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";

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
    }
    setSyncing(false);
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
      <div className="space-y-4">
        {/* Sync feedback sits above the list so the list stays a clean table. */}
        {error ? (
          <p className="rounded-control border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}
        {syncSummary ? (
          <p className="rounded-control border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
            {syncSummary}
          </p>
        ) : null}
        {warnings.length > 0 ? (
          <SettingsSection title="Sync warnings" bodyClassName="grid gap-1">
            {warnings.map((warning) => (
              <p
                key={warning}
                className="text-xs leading-relaxed text-muted-foreground"
              >
                {warning}
              </p>
            ))}
          </SettingsSection>
        ) : null}

        <SettingsSection
          title="Repo Skills"
          description={
            <>
              Synced from <code>.agents/skills</code> on the base branch.
              Auto-syncs on push (when skills change) and every 6 hours; use
              Sync from GitHub to refresh now. Type <code>/</code> in session,
              task, or project chat to invoke a harness skill.
            </>
          }
          // Rows own their padding so the divider spans the card's full width.
          bodyClassName="p-0"
        >
          {skills.length > 0 ? (
            <div className="divide-y divide-border">
              {availableSkills.map((skill) => (
                <SkillRow key={skill._id} skill={skill} />
              ))}
              {staleSkills.map((skill) => (
                <SkillRow key={skill._id} skill={skill} />
              ))}
            </div>
          ) : (
            <SettingsEmptyState
              icon={IconSparkles}
              title="No skills synced yet"
              description="Add a SKILL.md under .agents/skills on the base branch, then select Sync from GitHub."
            />
          )}
        </SettingsSection>
      </div>
    </PageWrapper>
  );
}
