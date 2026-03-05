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

interface RunTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTaskIds: Set<Id<"agentTasks">>;
  onSuccess: () => void;
}

export function RunTasksModal({
  isOpen,
  onClose,
  selectedTaskIds,
  onSuccess,
}: RunTasksModalProps) {
  const startExecution = useMutation(api.agentTasks.startExecution);
  const [isLoading, setIsLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const count = selectedTaskIds.size;

  const handleRun = async () => {
    setIsLoading(true);
    setRunError(null);
    try {
      const taskIds = [...selectedTaskIds];
      const results = await Promise.all(
        taskIds.map(async (id) => {
          try {
            await startExecution({ id });
            return true;
          } catch (err) {
            console.error(`Failed to start task ${id}:`, err);
            return false;
          }
        }),
      );
      const startedCount = results.filter((started) => started).length;
      if (startedCount === count) {
        onSuccess();
        onClose();
        return;
      }
      if (startedCount === 0) {
        setRunError(
          "Failed to start any selected tasks. Check task state and try again.",
        );
      } else {
        setRunError(
          `Started ${startedCount} of ${count} tasks. ${count - startedCount} failed to start.`,
        );
      }
    } catch (err) {
      console.error("Failed to run tasks:", err);
      setRunError("Failed to run selected tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setRunError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Run {count} task{count === 1 ? "" : "s"}?
          </DialogTitle>
          <DialogDescription>
            Eva will start working on the selected task
            {count === 1 ? "" : "s"} immediately.
          </DialogDescription>
        </DialogHeader>
        {runError && <p className="text-sm text-destructive">{runError}</p>}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={isLoading}>
            {isLoading && <Spinner size="sm" />}
            Run {count} task{count === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
