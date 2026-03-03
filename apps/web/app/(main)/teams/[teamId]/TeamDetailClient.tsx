"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@conductor/backend";
import { teamDetailTabParser } from "@/lib/search-params";
import type { Id } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EnvVarsTable } from "@/lib/components/EnvVarsTable";
import {
  Card,
  CardContent,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
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
import {
  IconPlus,
  IconTrash,
  IconUserPlus,
  IconGitBranch,
} from "@tabler/icons-react";

export function TeamDetailClient({ teamId }: { teamId: string }) {
  const team = useQuery(api.teams.get, { id: teamId as Id<"teams"> });
  const members =
    useQuery(api.teamMembers.list, team ? { teamId: team._id } : "skip") ?? [];
  const repos =
    useQuery(
      api.githubRepos.listByTeam,
      team ? { teamId: team._id } : "skip",
    ) ?? [];
  const allRepos = useQuery(api.githubRepos.list) ?? [];
  const teamEnvVars = useQuery(
    api.teamEnvVars.list,
    team ? { teamId: team._id } : "skip",
  );

  const addMember = useMutation(api.teamMembers.add);
  const removeMember = useMutation(api.teamMembers.remove);
  const updateRole = useMutation(api.teamMembers.updateRole);
  const assignRepo = useMutation(api.githubRepos.assignToTeam);
  const removeRepo = useMutation(api.githubRepos.removeFromTeam);
  const upsertTeamVar = useAction(api.teamEnvVarsActions.upsertVar);
  const revealTeamValue = useAction(api.teamEnvVarsActions.revealValue);
  const removeTeamVar = useMutation(api.teamEnvVars.removeVar);

  const [tab, setTab] = useQueryState("tab", teamDetailTabParser);

  const [memberDialog, setMemberDialog] = useState({
    open: false,
    email: "",
    error: "",
    isSubmitting: false,
  });

  const [repoDialog, setRepoDialog] = useState({
    open: false,
    selectedRepoId: "",
    error: "",
    isSubmitting: false,
  });

  if (!team) {
    return (
      <PageWrapper title="Team">
        <p className="text-sm text-muted-foreground">Team not found</p>
      </PageWrapper>
    );
  }

  const handleAddMember = async () => {
    if (!memberDialog.email.trim()) {
      setMemberDialog((prev) => ({ ...prev, error: "Email is required" }));
      return;
    }

    setMemberDialog((prev) => ({ ...prev, error: "", isSubmitting: true }));

    try {
      await addMember({ teamId: team._id, userEmail: memberDialog.email });
      setMemberDialog({
        open: false,
        email: "",
        error: "",
        isSubmitting: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add member";
      setMemberDialog((prev) => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false,
      }));
    }
  };

  const handleAddRepo = async () => {
    if (!repoDialog.selectedRepoId) {
      setRepoDialog((prev) => ({
        ...prev,
        error: "Please select a repository",
      }));
      return;
    }

    const foundRepo = allRepos.find((r) => r._id === repoDialog.selectedRepoId);
    if (!foundRepo) {
      setRepoDialog((prev) => ({ ...prev, error: "Repository not found" }));
      return;
    }

    setRepoDialog((prev) => ({ ...prev, error: "", isSubmitting: true }));

    try {
      await assignRepo({ teamId: team._id, repoId: foundRepo._id });
      setRepoDialog({
        open: false,
        selectedRepoId: "",
        error: "",
        isSubmitting: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add repository";
      setRepoDialog((prev) => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false,
      }));
    }
  };

  const handleMemberDialogChange = (open: boolean) => {
    if (!open) {
      setMemberDialog({
        open: false,
        email: "",
        error: "",
        isSubmitting: false,
      });
    } else {
      setMemberDialog((prev) => ({ ...prev, open: true }));
    }
  };

  const handleRepoDialogChange = (open: boolean) => {
    if (!open) {
      setRepoDialog({
        open: false,
        selectedRepoId: "",
        error: "",
        isSubmitting: false,
      });
    } else {
      setRepoDialog((prev) => ({ ...prev, open: true }));
    }
  };

  const availableRepos = allRepos.filter((r) => r.teamId !== team._id);

  return (
    <PageWrapper title={team.name}>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          if (v === "members" || v === "repos" || v === "env") setTab(v);
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="repos">Repositories</TabsTrigger>
          <TabsTrigger value="env">Environment Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <div className="mb-4 flex justify-end">
            {team.userRole === "owner" && (
              <Dialog
                open={memberDialog.open}
                onOpenChange={handleMemberDialogChange}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <IconUserPlus size={16} className="mr-1.5" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={memberDialog.email}
                        onChange={(e) =>
                          setMemberDialog((prev) => ({
                            ...prev,
                            email: e.target.value,
                            error: "",
                          }))
                        }
                        placeholder="user@example.com"
                        disabled={memberDialog.isSubmitting}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddMember()
                        }
                      />
                    </div>
                    {memberDialog.error && (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                        <p className="text-sm text-destructive">
                          {memberDialog.error}
                        </p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => handleMemberDialogChange(false)}
                      disabled={memberDialog.isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddMember}
                      disabled={memberDialog.isSubmitting}
                    >
                      {memberDialog.isSubmitting ? "Adding..." : "Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="space-y-2">
            {members.map((member) => (
              <Card key={member._id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">
                      {member.user?.fullName || member.user?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.user?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                      {member.role}
                    </span>
                    {team.userRole === "owner" && member.role !== "owner" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          removeMember({
                            teamId: team._id,
                            userId: member.userId,
                          })
                        }
                      >
                        <IconTrash size={14} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="repos">
          <div className="mb-4 flex justify-end">
            {team.userRole === "owner" && (
              <Dialog
                open={repoDialog.open}
                onOpenChange={handleRepoDialogChange}
              >
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
                        value={repoDialog.selectedRepoId}
                        onValueChange={(value) =>
                          setRepoDialog((prev) => ({
                            ...prev,
                            selectedRepoId: value,
                            error: "",
                          }))
                        }
                        disabled={repoDialog.isSubmitting}
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
                    {repoDialog.error && (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                        <p className="text-sm text-destructive">
                          {repoDialog.error}
                        </p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => handleRepoDialogChange(false)}
                      disabled={repoDialog.isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddRepo}
                      disabled={repoDialog.isSubmitting}
                    >
                      {repoDialog.isSubmitting ? "Adding..." : "Add"}
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
                    <IconGitBranch
                      size={16}
                      className="text-muted-foreground"
                    />
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
                  {team.userRole === "owner" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        removeRepo({ teamId: team._id, repoId: repo._id })
                      }
                    >
                      <IconTrash size={14} />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="env">
          {team && (
            <EnvVarsTable
              vars={teamEnvVars}
              onUpsert={async (key, value) => {
                await upsertTeamVar({ teamId: team._id, key, value });
              }}
              onReveal={(key) => revealTeamValue({ teamId: team._id, key })}
              onRemove={async (key) => {
                await removeTeamVar({ teamId: team._id, key });
              }}
              description="Team-level variables inherited by all repositories in this team."
            />
          )}
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
