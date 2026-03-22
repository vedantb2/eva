"use client";

import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useMutation } from "convex/react";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface DeleteTaskDialogProps {
  open: boolean;
  onClose: () => void;
  taskId: Id<"agentTasks">;
  taskTitle: string;
}

export function DeleteTaskDialog({
  open,
  onClose,
  taskId,
  taskTitle,
}: DeleteTaskDialogProps) {
  const deleteTask = useMutation(api.agentTasks.deleteCascade);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask({ id: taskId });
      onClose();
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Delete Task"
      description={
        <>
          Are you sure you want to delete <strong>{taskTitle}</strong>?
        </>
      }
      detail="This action cannot be undone."
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={handleDelete}
      isLoading={isDeleting}
    />
  );
}
