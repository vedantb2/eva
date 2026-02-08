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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from "@conductor/ui";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickTaskModal({ isOpen, onClose }: QuickTaskModalProps) {
  const { repo } = useRepo();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToKey, setAssignedToKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const users = useQuery(api.users.listAll);
  const createQuickTask = useMutation(api.agentTasks.createQuickTask);

  const handleSubmit = async () => {
    if (!title.trim() || !repo) return;

    setIsLoading(true);
    try {
      const assignedUser = users?.find((u) => u._id === assignedToKey);
      await createQuickTask({
        repoId: repo._id,
        title: title.trim(),
        description: description.trim() || undefined,
        assignedTo: assignedUser?._id,
      });
      setTitle("");
      setDescription("");
      setAssignedToKey("");
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
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Assign To</label>
            <Select value={assignedToKey} onValueChange={setAssignedToKey}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user (optional)" />
              </SelectTrigger>
              <SelectContent>
                {(users ?? []).map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.fullName ||
                      [user.firstName, user.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                      "Unnamed User"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !title.trim()}>
            {isLoading && <Spinner size="sm" />}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
