"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Spinner,
} from "@conductor/ui";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { BranchSelect } from "@/lib/components/BranchSelect";

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickTaskModal({ isOpen, onClose }: QuickTaskModalProps) {
  const { repo } = useRepo();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [baseBranch, setBaseBranch] = useState(
    repo.defaultBaseBranch ?? "main",
  );
  const [isLoading, setIsLoading] = useState(false);

  const createQuickTask = useMutation(api.agentTasks.createQuickTask);

  const handleSubmit = async () => {
    if (!title.trim() || !baseBranch || !repo) return;

    setIsLoading(true);
    try {
      await createQuickTask({
        repoId: repo._id,
        title: title.trim(),
        description: description.trim() || undefined,
        baseBranch,
        model: repo.defaultModel,
      });
      setTitle("");
      setDescription("");
      setBaseBranch(repo.defaultBaseBranch ?? "main");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Quick Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Add more details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={12}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Base Branch <span className="text-destructive">*</span>
            </label>
            <BranchSelect
              value={baseBranch}
              onValueChange={setBaseBranch}
              placeholder="Select a branch"
              className="h-10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || !baseBranch}
          >
            {isLoading && <Spinner size="sm" />}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
