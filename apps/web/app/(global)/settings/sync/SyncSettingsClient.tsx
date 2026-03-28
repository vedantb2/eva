"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache";
import { useAction, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button, Checkbox, Spinner } from "@conductor/ui";
import { IconRefresh } from "@tabler/icons-react";

type RepoEntry = {
  owner: string;
  name: string;
};

function dedupeRepos(
  dbRepos: Array<{ owner: string; name: string }>,
  githubRepos: Array<{ owner: string; name: string }> | undefined,
): Array<RepoEntry> {
  const seen = new Set<string>();
  const result: Array<RepoEntry> = [];

  const all = githubRepos ? [...dbRepos, ...githubRepos] : dbRepos;

  for (const repo of all) {
    const key = `${repo.owner}/${repo.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ owner: repo.owner, name: repo.name });
  }

  return result;
}

export function SyncSettingsClient() {
  const syncSettings = useQuery(api.syncSettings.list);
  const dbRepos = useQuery(api.githubRepos.list, { includeHidden: true });
  const setSyncSetting = useMutation(api.syncSettings.set);
  const bulkSetSyncSettings = useMutation(api.syncSettings.bulkSet);
  const listAvailableRepos = useAction(api.github.listAllAvailableRepos);

  const [fetching, setFetching] = useState(false);
  const [githubRepos, setGithubRepos] = useState<
    Array<{ owner: string; name: string }> | undefined
  >(undefined);

  const handleRefreshFromGithub = async () => {
    setFetching(true);
    try {
      const repos = await listAvailableRepos();
      setGithubRepos(repos);
    } catch (err) {
      console.error("Failed to fetch repos:", err);
    }
    setFetching(false);
  };

  const repos = dbRepos ? dedupeRepos(dbRepos, githubRepos) : [];

  const disabledSet = new Set(
    (syncSettings ?? [])
      .filter((s) => !s.enabled)
      .map((s) => `${s.owner}/${s.name}`),
  );

  const isRepoEnabled = (owner: string, name: string) =>
    !disabledSet.has(`${owner}/${name}`);

  const handleToggleRepo = (owner: string, name: string, enabled: boolean) => {
    void setSyncSetting({ owner, name, enabled });
  };

  const groupedRepos = repos.reduce<Record<string, Array<RepoEntry>>>(
    (groups, repo) => {
      if (!groups[repo.owner]) {
        groups[repo.owner] = [];
      }
      groups[repo.owner].push(repo);
      return groups;
    },
    {},
  );

  const owners = Object.keys(groupedRepos).sort();

  const isOwnerAllEnabled = (owner: string) =>
    groupedRepos[owner].every((r) => isRepoEnabled(r.owner, r.name));

  const isOwnerSomeEnabled = (owner: string) =>
    groupedRepos[owner].some((r) => isRepoEnabled(r.owner, r.name));

  const handleToggleOwner = (owner: string) => {
    const allEnabled = isOwnerAllEnabled(owner);
    const newEnabled = !allEnabled;
    void bulkSetSyncSettings({
      owner,
      repos: groupedRepos[owner].map((r) => ({
        name: r.name,
        enabled: newEnabled,
      })),
    });
  };

  return (
    <PageWrapper
      title="Sync Settings"
      showBack
      headerRight={
        <Button
          size="sm"
          variant="outline"
          disabled={fetching}
          onClick={handleRefreshFromGithub}
          className="motion-press border-border text-muted-foreground hover:scale-[1.01] active:scale-[0.99]"
        >
          <IconRefresh size={16} className={fetching ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh from GitHub</span>
        </Button>
      }
    >
      {syncSettings === undefined || dbRepos === undefined ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="md" />
        </div>
      ) : repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <p className="text-sm">
            No repos found. Sync your repos first, or fetch from GitHub to
            discover new ones.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={fetching}
            onClick={handleRefreshFromGithub}
          >
            <IconRefresh size={16} className={fetching ? "animate-spin" : ""} />
            Fetch from GitHub
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            Disabled repos will be skipped during sync. New repos default to
            enabled.
          </p>
          {owners.map((owner) => (
            <OwnerGroup
              key={owner}
              owner={owner}
              repos={groupedRepos[owner]}
              allEnabled={isOwnerAllEnabled(owner)}
              someEnabled={isOwnerSomeEnabled(owner)}
              isRepoEnabled={isRepoEnabled}
              onToggleOwner={() => handleToggleOwner(owner)}
              onToggleRepo={handleToggleRepo}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

function OwnerGroup({
  owner,
  repos,
  allEnabled,
  someEnabled,
  isRepoEnabled,
  onToggleOwner,
  onToggleRepo,
}: {
  owner: string;
  repos: Array<RepoEntry>;
  allEnabled: boolean;
  someEnabled: boolean;
  isRepoEnabled: (owner: string, name: string) => boolean;
  onToggleOwner: () => void;
  onToggleRepo: (owner: string, name: string, enabled: boolean) => void;
}) {
  const sorted = [...repos].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="rounded-lg bg-muted/40 p-3 sm:p-4">
      <label className="flex cursor-pointer items-center gap-2.5 pb-3">
        <Checkbox
          checked={allEnabled ? true : someEnabled ? "indeterminate" : false}
          onCheckedChange={onToggleOwner}
        />
        <span className="text-sm font-medium">{owner}</span>
        <span className="text-xs text-muted-foreground">
          {repos.filter((r) => isRepoEnabled(r.owner, r.name)).length}/
          {repos.length}
        </span>
      </label>
      <div className="space-y-1 pl-1">
        {sorted.map((repo) => {
          const enabled = isRepoEnabled(repo.owner, repo.name);
          return (
            <label
              key={repo.name}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60"
            >
              <Checkbox
                checked={enabled}
                onCheckedChange={(checked) =>
                  onToggleRepo(repo.owner, repo.name, checked === true)
                }
              />
              <span className="text-xs">{repo.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
