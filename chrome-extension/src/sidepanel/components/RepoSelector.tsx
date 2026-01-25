import { Select } from "@/components/ui/select";
import type { RepoInfo } from "@/shared/types";

interface RepoSelectorProps {
  repos: RepoInfo[];
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

  return (
    <Select
      value={selectedRepoId || ""}
      onChange={(e) => onRepoChange(e.target.value)}
      className="flex-1"
    >
      <option value="" disabled>
        Select repository...
      </option>
      {repos.map((repo) => (
        <option key={repo._id} value={repo._id}>
          {repo.owner}/{repo.name}
        </option>
      ))}
    </Select>
  );
}
