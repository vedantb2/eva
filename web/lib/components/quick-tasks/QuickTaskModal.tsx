"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>New Quick Task</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="What needs to be done?"
              value={title}
              onValueChange={setTitle}
              autoFocus
            />
            <Textarea
              label="Description"
              placeholder="Add more details (optional)"
              value={description}
              onValueChange={setDescription}
              minRows={3}
            />
            <Select
              label="Assign To"
              placeholder="Select a user (optional)"
              selectedKeys={assignedToKey ? [assignedToKey] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setAssignedToKey(selected ? String(selected) : "");
              }}
            >
              {(users ?? []).map((user) => (
                <SelectItem key={user._id}>
                  {user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unnamed User"}
                </SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!title.trim()}
          >
            Create Task
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
