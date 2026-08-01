import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Surface,
} from "@eva/ui";
import { IconEye, IconBrandGithub } from "@tabler/icons-react";

interface HiddenReposSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HiddenReposSheet({
  open,
  onOpenChange,
}: HiddenReposSheetProps) {
  const allRepos = useQuery(api.githubRepos.list, { includeHidden: true });
  const toggleHidden = useMutation(
    api.githubRepos.toggleHidden,
  ).withOptimisticUpdate((localStore, args) => {
    const withHidden = localStore.getQuery(api.githubRepos.list, {
      includeHidden: true,
    });
    if (withHidden !== undefined) {
      localStore.setQuery(
        api.githubRepos.list,
        { includeHidden: true },
        withHidden.map((r) =>
          r._id === args.repoId ? { ...r, hidden: args.hidden } : r,
        ),
      );
    }
  });

  const hiddenRepos = allRepos?.filter((r) => r.hidden === true) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hidden Codebases</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
          {hiddenRepos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hidden codebases
            </p>
          ) : (
            hiddenRepos.map((repo) => (
              <Surface
                key={repo._id}
                density="tight"
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <IconBrandGithub className="size-5 shrink-0 text-muted-foreground" />
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
                  <IconEye className="size-4" />
                  Show
                </Button>
              </Surface>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
