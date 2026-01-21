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
      <div className="flex-1 text-sm text-slate-500">No repos connected</div>
    );
  }

  return (
    <select
      value={selectedRepoId || ""}
      onChange={(e) => onRepoChange(e.target.value)}
      className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
    >
      <option value="" disabled>
        Select repository...
      </option>
      {repos.map((repo) => (
        <option key={repo._id} value={repo._id}>
          {repo.owner}/{repo.name}
        </option>
      ))}
    </select>
  );
}
