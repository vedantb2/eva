import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
} from "@conductor/ui";
import { IconEye, IconEyeOff, IconBrandGithub } from "@tabler/icons-react";

export function HiddenReposSheet() {
  const allRepos = useQuery(api.githubRepos.list, { includeHidden: true });
  const toggleHidden = useMutation(api.githubRepos.toggleHidden);

  const hiddenRepos = allRepos?.filter((r) => r.hidden === true) ?? [];

  if (hiddenRepos.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="motion-press border-border text-muted-foreground hover:scale-[1.01] active:scale-[0.99]"
        >
          <IconEyeOff size={16} />
          <span className="hidden sm:inline">{hiddenRepos.length} hidden</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hidden Repositories</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
          {hiddenRepos.map((repo) => (
            <div
              key={repo._id}
              className="flex items-center justify-between rounded-lg bg-muted/40 p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <IconBrandGithub
                  size={18}
                  className="shrink-0 text-muted-foreground"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {repo.rootDirectory
                      ? repo.rootDirectory.split("/").pop()
                      : repo.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {repo.owner}/{repo.name}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  toggleHidden({ repoId: repo._id, hidden: false })
                }
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <IconEye size={16} />
                Show
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
