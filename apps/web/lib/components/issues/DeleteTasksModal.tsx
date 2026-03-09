"use client";

import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Spinner,
} from "@conductor/ui";

interface DeleteTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTaskIds: Set<Id<"agentTasks">>;
  onSuccess: () => void;
}

export function DeleteTasksModal({
  isOpen,
  onClose,
  selectedTaskIds,
  onSuccess,
}: DeleteTasksModalProps) {
  const removeTask = useMutation(api.agentTasks.remove);
  const [isLoading, setIsLoading] = useState(false);

  const count = selectedTaskIds.size;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await Promise.all([...selectedTaskIds].map((id) => removeTask({ id })));
      onSuccess();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Delete {count} task{count === 1 ? "" : "s"}?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The selected task
            {count === 1 ? "" : "s"} will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Spinner size="sm" />}
            Delete {count} task{count === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
