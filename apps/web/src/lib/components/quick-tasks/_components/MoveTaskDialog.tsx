import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useRepo } from "@/lib/contexts/RepoContext";
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
  const { repoId } = useRepo();
  const updateTask = useMutation(api.agentTasks.update).withOptimisticUpdate(
    (localStore, args) => {
      // Moving to a different repo — remove from the current repo's list
      if (args.repoId) {
        const current = localStore.getQuery(api.agentTasks.getAllTasks, {
          repoId,
        });
        if (current !== undefined) {
          localStore.setQuery(
            api.agentTasks.getAllTasks,
            { repoId },
            current.filter((task) => task._id !== args.id),
          );
        }
      }
    },
  );
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async () => {
    if (!targetId) return;
    setIsMoving(true);
    try {
      await updateTask({ id: taskId, repoId: targetId });
      onClose();
    } catch (err) {
      console.error("Failed to move task:", err);
    }
    setIsMoving(false);
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
