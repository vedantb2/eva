import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { IconFolder } from "@tabler/icons-react";
import { TeamRepoCard } from "./TeamRepoCard";
import { TeamAddRepoDialog } from "./TeamAddRepoDialog";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";

type Repo = FunctionReturnType<typeof api.githubRepos.listByTeam>[number];

interface TeamReposTabProps {
  teamId: Id<"teams">;
  repos: Array<Repo>;
  allRepos: Array<Repo>;
  isOwner: boolean;
}

export function TeamReposTab({
  teamId,
  repos,
  allRepos,
  isOwner,
}: TeamReposTabProps) {
  const assignRepo = useMutation(
    api.githubRepos.assignToTeam,
  ).withOptimisticUpdate((localStore, args) => {
    const currentTeamRepos = localStore.getQuery(api.githubRepos.listByTeam, {
      teamId: args.teamId,
    });
    const currentAllRepos = localStore.getQuery(api.githubRepos.list, {
      includeHidden: true,
    });
    const assignedRepo = currentAllRepos?.find((r) => r._id === args.repoId);
    if (currentTeamRepos !== undefined && assignedRepo) {
      localStore.setQuery(api.githubRepos.listByTeam, { teamId: args.teamId }, [
        ...currentTeamRepos,
        { ...assignedRepo, teamId: args.teamId },
      ]);
    }
    if (currentAllRepos !== undefined) {
      localStore.setQuery(
        api.githubRepos.list,
        { includeHidden: true },
        currentAllRepos.map((r) =>
          r._id === args.repoId ? { ...r, teamId: args.teamId } : r,
        ),
      );
    }
  });
  const removeRepo = useMutation(
    api.githubRepos.removeFromTeam,
  ).withOptimisticUpdate((localStore, args) => {
    const currentTeamRepos = localStore.getQuery(api.githubRepos.listByTeam, {
      teamId: args.teamId,
    });
    if (currentTeamRepos !== undefined) {
      localStore.setQuery(
        api.githubRepos.listByTeam,
        { teamId: args.teamId },
        currentTeamRepos.filter((repo) => repo._id !== args.repoId),
      );
    }
    const currentAllRepos = localStore.getQuery(api.githubRepos.list, {
      includeHidden: true,
    });
    if (currentAllRepos !== undefined) {
      localStore.setQuery(
        api.githubRepos.list,
        { includeHidden: true },
        currentAllRepos.map((r) =>
          r._id === args.repoId ? { ...r, teamId: undefined } : r,
        ),
      );
    }
  });

  const availableRepos = allRepos.filter((r) => r.teamId !== teamId);

  return (
    <SettingsSection
      title="Codebases"
      description="Repositories assigned to this team."
      action={
        isOwner ? (
          <TeamAddRepoDialog
            availableRepos={availableRepos}
            onAdd={async (repoId) => {
              // Awaited and discarded: the mutation resolves to null, and the
              // dialog only needs to know when it settled.
              await assignRepo({ teamId, repoId });
            }}
          />
        ) : undefined
      }
      bodyVariant="list"
    >
      {repos.length === 0 ? (
        <SettingsEmptyState
          icon={IconFolder}
          title="No codebases yet"
          description="Assign a repository to this team."
        />
      ) : (
        <div className="divide-y divide-border">
          {repos.map((repo) => (
            <TeamRepoCard
              key={repo._id}
              repo={repo}
              teamId={teamId}
              isOwner={isOwner}
              onRemove={(repoId) => removeRepo({ teamId, repoId })}
            />
          ))}
        </div>
      )}
    </SettingsSection>
  );
}
