"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@conductor/ui";
import { IconPlus, IconUsers } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function TeamsClient() {
  const router = useRouter();
  const teams = useQuery(api.teams.list) ?? [];
  const createTeam = useMutation(api.teams.create);

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
          Manage your teams and collaborate on repositories
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
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
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
        {teams.map((team) => (
          <div
            key={team._id}
            onClick={() => router.push(`/teams/${team._id}`)}
            className="cursor-pointer"
          >
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <IconUsers size={16} className="text-primary" />
                    </div>
                    <CardTitle className="text-base">
                      {team.displayName ?? team.name}
                    </CardTitle>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                    {team.userRole}
                  </span>
                </div>
              </CardHeader>
            </Card>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconUsers size={48} className="mb-4 text-muted-foreground/50" />
            <p className="mb-2 text-sm font-medium">No teams yet</p>
            <p className="mb-4 text-xs text-muted-foreground">
              Create a team to collaborate on repositories
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
