"use client";

import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useState } from "react";
import { useRepo } from "@/lib/contexts/RepoContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Spinner,
  Input,
  Badge,
} from "@conductor/ui";

interface TaskForLabel {
  _id: Id<"agentTasks">;
  tags?: string[];
}

interface AddLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTasks: TaskForLabel[];
  onSuccess: () => void;
}

export function AddLabelsModal({
  isOpen,
  onClose,
  selectedTasks,
  onSuccess,
}: AddLabelsModalProps) {
  const { repoId } = useRepo();
  const updateTask = useMutation(api.agentTasks.update).withOptimisticUpdate(
    (localStore, args) => {
      const current = localStore.getQuery(api.agentTasks.getAllTasks, {
        repoId,
      });
      if (current !== undefined) {
        localStore.setQuery(
          api.agentTasks.getAllTasks,
          { repoId },
          current.map((task) =>
            task._id === args.id
              ? { ...task, tags: args.tags ?? task.tags }
              : task,
          ),
        );
      }
    },
  );
  const [labelsInput, setLabelsInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const count = selectedTasks.length;
  const newLabels = labelsInput
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  const handleClose = () => {
    setLabelsInput("");
    onClose();
  };

  const handleAdd = async () => {
    if (newLabels.length === 0) return;
    setIsLoading(true);
    try {
      await Promise.all(
        selectedTasks.map((task) => {
          const existingTags = task.tags ?? [];
          const merged = [...new Set([...existingTags, ...newLabels])];
          return updateTask({ id: task._id, tags: merged });
        }),
      );
      setLabelsInput("");
      onSuccess();
      onClose();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Add labels to {count} task{count === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Enter labels as comma-separated values. They will be added to each
            task's existing labels.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            placeholder="bug, ui, backend"
            value={labelsInput}
            onChange={(e) => setLabelsInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleAdd();
              }
            }}
            autoFocus
          />
          {newLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {newLabels.map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isLoading || newLabels.length === 0}
          >
            {isLoading && <Spinner size="sm" />}
            Add Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
