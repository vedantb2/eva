"use client";

import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useMutation } from "convex/react";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface MoveTaskDialogProps {
  targetId: Id<"githubRepos"> | null;
  targetAppName: string;
  onClose: () => void;
  taskId: Id<"agentTasks">;
  taskTitle: string;
}

export function MoveTaskDialog({
  targetId,
  targetAppName,
  onClose,
  taskId,
  taskTitle,
}: MoveTaskDialogProps) {
  const updateTask = useMutation(api.agentTasks.update);
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async () => {
    if (!targetId) return;
    setIsMoving(true);
    try {
      await updateTask({ id: taskId, repoId: targetId });
      onClose();
    } catch (err) {
      console.error("Failed to move task:", err);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <ConfirmDialog
      open={targetId !== null}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Move Task"
      description={
        <>
          Move <strong>{taskTitle}</strong> to <strong>{targetAppName}</strong>?
        </>
      }
      detail="The task will appear in the other app's quick tasks."
      confirmLabel="Move"
      onConfirm={handleMove}
      isLoading={isMoving}
    />
  );
}
