import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  return (
    <Select value={selectedRepoId || ""} onValueChange={onRepoChange}>
      <SelectTrigger className="flex-1 min-w-[180px]">
        <SelectValue placeholder="Select repository..." />
      </SelectTrigger>
      <SelectContent>
        {repos.map((repo) => (
          <SelectItem key={repo._id} value={repo._id}>
            {repo.owner}/{repo.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
