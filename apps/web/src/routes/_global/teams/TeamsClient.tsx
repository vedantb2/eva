import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Card,
  CardContent,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@eva/ui";
import { IconPlus, IconUsers } from "@tabler/icons-react";
import { TeamDeleteDialog } from "./_components/TeamDeleteDialog";
import { TeamCard } from "./_components/TeamCard";

export function TeamsClient() {
  const teams = useQuery(api.teams.list);
  const createTeam = useMutation(api.teams.create);
  const deleteTeam = useMutation(api.teams.remove).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.teams.list, {});
      if (current !== undefined) {
        localStore.setQuery(
          api.teams.list,
          {},
          current.filter((team) => team._id !== args.id),
        );
      }
    },
  );

  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<"teams">;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteTeam({ id: deleteTarget.id });
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
    }
    setIsDeleting(false);
  };

  const [createDialog, setCreateDialog] = useState({
    open: false,
    name: "",
    error: "",
    isSubmitting: false,
  });

  const handleCreate = async () => {
    if (!createDialog.name.trim()) {
      setCreateDialog((prev) => ({ ...prev, error: "Team name is required" }));
      return;
    }

    setCreateDialog((prev) => ({ ...prev, error: "", isSubmitting: true }));

    try {
      await createTeam({ name: createDialog.name });
      setCreateDialog({
        open: false,
        name: "",
        error: "",
        isSubmitting: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create team";
      setCreateDialog((prev) => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false,
      }));
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCreateDialog({
        open: false,
        name: "",
        error: "",
        isSubmitting: false,
      });
    } else {
      setCreateDialog((prev) => ({ ...prev, open: true }));
    }
  };

  return (
    <PageWrapper title="Teams">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage your teams and collaborate on codebases
        </p>
        <Dialog open={createDialog.open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm">
              <IconPlus size={16} className="mr-1.5" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  value={createDialog.name}
                  onChange={(e) =>
                    setCreateDialog((prev) => ({
                      ...prev,
                      name: e.target.value,
                      error: "",
                    }))
                  }
                  placeholder="Team name"
                  disabled={createDialog.isSubmitting}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              {createDialog.error && (
                <div className="rounded-surface border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">
                    {createDialog.error}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createDialog.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createDialog.isSubmitting}
              >
                {createDialog.isSubmitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams === undefined
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-surface border border-border bg-muted/60"
              />
            ))
          : teams.map((team) => (
              <TeamCard key={team._id} team={team} onDelete={setDeleteTarget} />
            ))}
      </div>

      <TeamDeleteDialog
        team={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      {teams !== undefined && teams.length === 0 && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconUsers size={48} className="mb-4 text-muted-foreground/50" />
            <p className="mb-2 text-sm font-medium">No teams yet</p>
            <p className="mb-4 text-xs text-muted-foreground">
              Create a team to collaborate on codebases
            </p>
            <Button
              size="sm"
              onClick={() =>
                setCreateDialog((prev) => ({ ...prev, open: true }))
              }
            >
              <IconPlus size={16} className="mr-1.5" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}
