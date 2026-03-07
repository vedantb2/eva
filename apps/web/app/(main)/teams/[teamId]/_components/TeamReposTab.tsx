"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import {
  Card,
  CardContent,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@conductor/ui";
import { IconPlus, IconTrash, IconGitBranch } from "@tabler/icons-react";

type Repo = FunctionReturnType<typeof api.githubRepos.listByTeam>[number];

interface TeamReposTabProps {
  teamId: Id<"teams">;
  repos: Array<Repo>;
  allRepos: Array<Repo>;
  isOwner: boolean;
}

export function TeamReposTab({
  teamId,
  repos,
  allRepos,
  isOwner,
}: TeamReposTabProps) {
  const assignRepo = useMutation(api.githubRepos.assignToTeam);
  const removeRepo = useMutation(api.githubRepos.removeFromTeam);

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

    const foundRepo = allRepos.find((r) => r._id === dialog.selectedRepoId);
    if (!foundRepo) {
      setDialog((prev) => ({ ...prev, error: "Repository not found" }));
      return;
    }

    setDialog((prev) => ({ ...prev, error: "", isSubmitting: true }));

    try {
      await assignRepo({ teamId, repoId: foundRepo._id });
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

  const availableRepos = allRepos.filter((r) => r.teamId !== teamId);

  return (
    <>
      <div className="mb-4 flex justify-end">
        {isOwner && (
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
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Repository
                  </label>
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
                </div>
                {dialog.error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{dialog.error}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                  disabled={dialog.isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddRepo} disabled={dialog.isSubmitting}>
                  {dialog.isSubmitting ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="space-y-2">
        {repos.map((repo) => (
          <Card key={repo._id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <IconGitBranch size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {repo.rootDirectory
                      ? repo.rootDirectory.split("/").pop()
                      : repo.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {repo.owner}/{repo.name}
                  </p>
                </div>
              </div>
              {isOwner && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeRepo({ teamId, repoId: repo._id })}
                >
                  <IconTrash size={14} />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
