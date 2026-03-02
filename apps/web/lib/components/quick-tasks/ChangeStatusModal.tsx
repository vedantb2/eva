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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@conductor/ui";

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "business_review", label: "Business Review" },
  { value: "code_review", label: "Code Review" },
  { value: "done", label: "Done" },
] as const;

type TaskStatus = (typeof STATUS_OPTIONS)[number]["value"];

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTaskIds: Set<Id<"agentTasks">>;
  onSuccess: () => void;
}

export function ChangeStatusModal({
  isOpen,
  onClose,
  selectedTaskIds,
  onSuccess,
}: ChangeStatusModalProps) {
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const count = selectedTaskIds.size;
  const taskIds = [...selectedTaskIds];

  const handleClose = () => {
    setSelectedStatus("");
    onClose();
  };

  const handleChangeStatus = async () => {
    if (!selectedStatus) return;
    setIsLoading(true);
    try {
      await Promise.all(
        taskIds.map((id) =>
          updateStatus({ id, status: selectedStatus as TaskStatus }),
        ),
      );
      setSelectedStatus("");
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
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Change status of {count} task{count === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            All selected tasks will be moved to the chosen status.
          </DialogDescription>
        </DialogHeader>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangeStatus}
            disabled={isLoading || !selectedStatus}
          >
            {isLoading && <Spinner size="sm" />}
            Change Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
