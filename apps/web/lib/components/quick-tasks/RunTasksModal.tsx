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
  const triggerExecution = useMutation(api.taskWorkflow.triggerExecution);
  const [isLoading, setIsLoading] = useState(false);

  const count = selectedTaskIds.size;

  const handleRun = async () => {
    setIsLoading(true);
    try {
      for (const id of selectedTaskIds) {
        const result = await startExecution({ id });
        await triggerExecution({
          runId: result.runId,
          taskId: result.taskId,
          repoId: result.repoId,
          installationId: result.installationId,
          projectId: result.projectId,
          branchName: result.branchName,
          baseBranch: result.projectId ? undefined : result.baseBranch,
          isFirstTaskOnBranch: result.isFirstTaskOnBranch,
          model: result.model,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to run tasks:", err);
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
            Run {count} task{count === 1 ? "" : "s"}?
          </DialogTitle>
          <DialogDescription>
            Eva will start working on the selected task
            {count === 1 ? "" : "s"} immediately.
          </DialogDescription>
        </DialogHeader>
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
