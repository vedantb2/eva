import { useState } from "react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@eva/ui";
import { IconPlus } from "@tabler/icons-react";

type Repo = FunctionReturnType<typeof api.githubRepos.listByTeam>[number];

/** "Add Repository" trigger + dialog for the team codebases section header. */
export function TeamAddRepoDialog({
  availableRepos,
  onAdd,
}: {
  availableRepos: Array<Repo>;
  onAdd: (repoId: Id<"githubRepos">) => Promise<void>;
}) {
  const [dialog, setDialog] = useState({
    open: false,
    selectedRepoId: "",
    error: "",
    isSubmitting: false,
  });

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setDialog({
        open: false,
        selectedRepoId: "",
        error: "",
        isSubmitting: false,
      });
    } else {
      setDialog((prev) => ({ ...prev, open: true }));
    }
  };

  const handleAddRepo = async () => {
    if (!dialog.selectedRepoId) {
      setDialog((prev) => ({
        ...prev,
        error: "Please select a repository",
      }));
      return;
    }

    const foundRepo = availableRepos.find(
      (r) => r._id === dialog.selectedRepoId,
    );
    if (!foundRepo) {
      setDialog((prev) => ({ ...prev, error: "Repository not found" }));
      return;
    }

    setDialog((prev) => ({ ...prev, error: "", isSubmitting: true }));

    try {
      await onAdd(foundRepo._id);
      setDialog({
        open: false,
        selectedRepoId: "",
        error: "",
        isSubmitting: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add repository";
      setDialog((prev) => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false,
      }));
    }
  };

  return (
    <Dialog open={dialog.open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <IconPlus size={16} className="mr-1.5" />
          Add Repository
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Repository</DialogTitle>
          <DialogDescription>Assign a codebase to this team.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {availableRepos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No unassigned codebases available.
            </p>
          ) : (
            <Select
              value={dialog.selectedRepoId}
              onValueChange={(value) =>
                setDialog((prev) => ({
                  ...prev,
                  selectedRepoId: value,
                  error: "",
                }))
              }
              disabled={dialog.isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a repository" />
              </SelectTrigger>
              <SelectContent>
                {availableRepos.map((repo) => (
                  <SelectItem key={repo._id} value={repo._id}>
                    {repo.owner}/{repo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {dialog.error ? (
            <div className="rounded-surface border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{dialog.error}</p>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => handleDialogChange(false)}
            disabled={dialog.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddRepo}
            disabled={dialog.isSubmitting || availableRepos.length === 0}
          >
            {dialog.isSubmitting ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
