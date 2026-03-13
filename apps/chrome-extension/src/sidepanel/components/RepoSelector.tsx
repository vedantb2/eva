import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@conductor/ui";
import type { Doc, Id } from "@conductor/backend";

interface RepoSelectorProps {
  repos: Doc<"githubRepos">[];
  selectedRepoId: Id<"githubRepos"> | null;
  onRepoChange: (repoId: Id<"githubRepos">) => void;
}

export function RepoSelector({
  repos,
  selectedRepoId,
  onRepoChange,
}: RepoSelectorProps) {
  if (repos.length === 0) {
    return (
      <div className="flex-1 text-sm text-muted-foreground">
        No repos connected
      </div>
    );
  }

  const groups = useMemo(() => {
    const byOwner: Record<string, Record<string, Doc<"githubRepos">[]>> = {};

    for (const repo of repos) {
      if (!byOwner[repo.owner]) byOwner[repo.owner] = {};
      if (!byOwner[repo.owner][repo.name]) byOwner[repo.owner][repo.name] = [];
      byOwner[repo.owner][repo.name].push(repo);
    }

    return Object.keys(byOwner)
      .sort()
      .map((owner) => ({
        owner,
        repoGroups: Object.keys(byOwner[owner])
          .sort()
          .map((name) => ({
            name,
            entries: byOwner[owner][name],
          })),
      }));
  }, [repos]);

  const selectedRepo = repos.find((r) => r._id === selectedRepoId);
  const displayLabel = selectedRepo
    ? selectedRepo.rootDirectory
      ? `${selectedRepo.name}/${selectedRepo.rootDirectory.split("/").pop()}`
      : selectedRepo.name
    : undefined;

  return (
    <Select
      value={selectedRepoId ?? ""}
      onValueChange={(val) => {
        const repo = repos.find((r) => r._id === val);
        if (repo) onRepoChange(repo._id);
      }}
    >
      <SelectTrigger className="flex-1 min-w-[180px]">
        <SelectValue placeholder="Select repository...">
          {displayLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72 overflow-auto">
        {groups.map((group) => (
          <SelectGroup key={group.owner}>
            <SelectLabel>{group.owner}</SelectLabel>
            {group.repoGroups.map((rg) => {
              const isMonorepo = rg.entries.some((r) => r.rootDirectory);

              if (!isMonorepo) {
                const repo = rg.entries[0];
                return (
                  <SelectItem key={repo._id} value={repo._id}>
                    {repo.name}
                  </SelectItem>
                );
              }

              return rg.entries.map((repo) => {
                const appName =
                  repo.rootDirectory?.split("/").pop() ?? repo.name;
                return (
                  <SelectItem key={repo._id} value={repo._id}>
                    {`${rg.name}/${appName}`}
                  </SelectItem>
                );
              });
            })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
