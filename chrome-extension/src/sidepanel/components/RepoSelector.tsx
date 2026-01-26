import { Select } from "@/components/ui/select";

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

  const options = repos.map((repo) => ({
    value: repo._id,
    label: `${repo.owner}/${repo.name}`,
  }));

  return (
    <Select
      value={selectedRepoId || ""}
      options={options}
      onChange={onRepoChange}
      placeholder="Select repository..."
      className="flex-1 min-w-[180px]"
    />
  );
}
