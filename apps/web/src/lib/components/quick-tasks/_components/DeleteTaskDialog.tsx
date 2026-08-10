"use client";

import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useRepo } from "@/lib/contexts/RepoContext";
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
  const { repoId } = useRepo();
  const deleteTask = useMutation(
    api.agentTasks.deleteCascade,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.agentTasks.getAllTasks, { repoId });
    if (current !== undefined) {
      localStore.setQuery(
        api.agentTasks.getAllTasks,
        { repoId },
        current.filter((task) => task._id !== args.id),
      );
    }
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask({ id: taskId });
      onClose();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
    setIsDeleting(false);
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
