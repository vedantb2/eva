import { useState } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import {
  Badge,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@eva/ui";
import { IconTrash, IconUserPlus, IconUsers } from "@tabler/icons-react";
import { UserInitials } from "@eva/shared";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";

type Member = FunctionReturnType<typeof api.teamMembers.list>[number];

interface TeamMembersTabProps {
  teamId: Id<"teams">;
  members: Array<Member>;
  isOwner: boolean;
}

export function TeamMembersTab({
  teamId,
  members,
  isOwner,
}: TeamMembersTabProps) {
  const currentUserId = useQuery(api.auth.me);
  const addMember = useMutation(api.teamMembers.add);
  const removeMember = useMutation(api.teamMembers.remove).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.teamMembers.list, {
        teamId: args.teamId,
      });
      if (current !== undefined) {
        localStore.setQuery(
          api.teamMembers.list,
          { teamId: args.teamId },
          current.filter((member) => member.userId !== args.userId),
        );
      }
    },
  );
  const updateRole = useMutation(
    api.teamMembers.updateRole,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.teamMembers.list, {
      teamId: args.teamId,
    });
    if (current !== undefined) {
      localStore.setQuery(
        api.teamMembers.list,
        { teamId: args.teamId },
        current.map((member) =>
          member.userId === args.userId
            ? { ...member, role: args.role }
            : member,
        ),
      );
    }
  });

  const [dialog, setDialog] = useState({
    open: false,
    email: "",
    error: "",
    isSubmitting: false,
  });

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setDialog({ open: false, email: "", error: "", isSubmitting: false });
    } else {
      setDialog((prev) => ({ ...prev, open: true }));
    }
  };

  const handleAddMember = async () => {
    if (!dialog.email.trim()) {
      setDialog((prev) => ({ ...prev, error: "Email is required" }));
      return;
    }

    setDialog((prev) => ({ ...prev, error: "", isSubmitting: true }));

    try {
      await addMember({ teamId, userEmail: dialog.email });
      setDialog({ open: false, email: "", error: "", isSubmitting: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add member";
      setDialog((prev) => ({
        ...prev,
        error: errorMessage,
        isSubmitting: false,
      }));
    }
  };

  return (
    <SettingsSection
      title="Members"
      description="People with access to this team."
      action={
        isOwner ? (
          <Dialog open={dialog.open} onOpenChange={handleDialogChange}>
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
                  <Input
                    type="email"
                    value={dialog.email}
                    onChange={(e) =>
                      setDialog((prev) => ({
                        ...prev,
                        email: e.target.value,
                        error: "",
                      }))
                    }
                    placeholder="Email address"
                    disabled={dialog.isSubmitting}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                  />
                </div>
                {dialog.error && (
                  <div className="rounded-surface border border-destructive/50 bg-destructive/10 p-3">
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
                <Button
                  onClick={handleAddMember}
                  disabled={dialog.isSubmitting}
                >
                  {dialog.isSubmitting ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : undefined
      }
      bodyVariant="list"
    >
      {members.length === 0 ? (
        <SettingsEmptyState
          icon={IconUsers}
          title="No members yet"
          description="Invite teammates by email to collaborate."
        />
      ) : (
        <div className="divide-y divide-border">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <UserInitials userId={member.userId} hideLastSeen size="md" />
                <div className="min-w-0">
                  <p data-pii className="truncate text-2sm font-medium">
                    {member.user?.fullName || member.user?.email || "Unknown"}
                  </p>
                  <p
                    data-pii
                    className="truncate text-2xs text-muted-foreground"
                  >
                    {member.user?.email}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isOwner && member.userId !== currentUserId ? (
                  <Select
                    value={member.role}
                    onValueChange={(role: "owner" | "member") =>
                      updateRole({ teamId, userId: member.userId, role })
                    }
                  >
                    <SelectTrigger className="h-7 w-[100px] border-0 bg-secondary text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">owner</SelectItem>
                      <SelectItem value="member">member</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="quiet">{member.role}</Badge>
                )}
                {isOwner && member.userId !== currentUserId && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() =>
                      removeMember({ teamId, userId: member.userId })
                    }
                  >
                    <IconTrash size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </SettingsSection>
  );
}
