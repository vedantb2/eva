import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@conductor/ui";

interface RepoSelectorProps {
  repos: Array<{
    _id: string;
    owner: string;
    name: string;
  }>;
  selectedRepoId: string | null;
  onRepoChange: (repoId: string) => void;
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

  const reposByOwner = repos.reduce(
    (acc, repo) => {
      if (!acc[repo.owner]) {
        acc[repo.owner] = [];
      }
      acc[repo.owner].push(repo);
      return acc;
    },
    {} as Record<string, typeof repos>,
  );

  const sortedOwners = Object.keys(reposByOwner).sort();

  return (
    <Select value={selectedRepoId || ""} onValueChange={onRepoChange}>
      <SelectTrigger className="flex-1 min-w-[180px]">
        <SelectValue placeholder="Select repository..." />
      </SelectTrigger>
      <SelectContent>
        {sortedOwners.map((owner) => (
          <SelectGroup key={owner}>
            <SelectLabel>{owner}</SelectLabel>
            {reposByOwner[owner].map((repo) => (
              <SelectItem key={repo._id} value={repo._id}>
                {repo.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
