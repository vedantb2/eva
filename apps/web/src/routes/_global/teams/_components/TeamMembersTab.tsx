import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
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
} from "@conductor/ui";
import { IconTrash, IconUserPlus } from "@tabler/icons-react";
import { UserInitials } from "@conductor/shared";

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
  const addMember = useMutation(api.teamMembers.add);
  const removeMember = useMutation(api.teamMembers.remove);

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
    <>
      <div className="mb-4 flex justify-end">
        {isOwner && (
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
                <Button
                  onClick={handleAddMember}
                  disabled={dialog.isSubmitting}
                >
                  {dialog.isSubmitting ? "Adding..." : "Add"}
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
              <div className="flex items-center gap-3">
                <UserInitials userId={member.userId} hideLastSeen size="md" />
                <div>
                  <p className="text-sm font-medium">
                    {member.user?.fullName || member.user?.email || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                  {member.role}
                </span>
                {isOwner && member.role !== "owner" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      removeMember({ teamId, userId: member.userId })
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
    </>
  );
}
