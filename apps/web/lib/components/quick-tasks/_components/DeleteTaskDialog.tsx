"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@conductor/ui";
import { IconLoader2 } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useState } from "react";

interface DeleteTaskDialogProps {
  taskId: Id<"agentTasks">;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTaskDialog({
  taskId,
  title,
  open,
  onOpenChange,
}: DeleteTaskDialogProps) {
  const deleteTask = useMutation(api.agentTasks.deleteCascade);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask({ id: taskId });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
        </DialogHeader>
        <div>
          <p className="text-muted-foreground">
            Are you sure you want to delete <strong>{title}</strong>?
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <IconLoader2 size={16} className="animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
