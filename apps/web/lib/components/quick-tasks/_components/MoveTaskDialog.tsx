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

interface MoveTaskDialogProps {
  taskId: Id<"agentTasks">;
  title: string;
  moveTarget: { id: Id<"githubRepos">; appName: string } | null;
  onOpenChange: (open: boolean) => void;
}

export function MoveTaskDialog({
  taskId,
  title,
  moveTarget,
  onOpenChange,
}: MoveTaskDialogProps) {
  const updateTask = useMutation(api.agentTasks.update);
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async () => {
    if (!moveTarget) return;
    setIsMoving(true);
    try {
      await updateTask({ id: taskId, repoId: moveTarget.id });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to move task:", err);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog
      open={moveTarget !== null}
      onOpenChange={(v) => {
        if (!v) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move Task</DialogTitle>
        </DialogHeader>
        <div>
          <p className="text-muted-foreground">
            Move <strong>{title}</strong> to{" "}
            <strong>{moveTarget?.appName}</strong>?
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            The task will appear in the other app&apos;s quick tasks.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isMoving}>
            {isMoving && <IconLoader2 size={16} className="animate-spin" />}
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
