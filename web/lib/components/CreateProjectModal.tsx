"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../backend/convex/_generated/api";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { Input } from "./ui/Input";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const createProject = useMutation(api.projects.create);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    setIsLoading(true);
    setError("");
    await createProject({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    setIsLoading(false);
    setName("");
    setDescription("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      size="md"
      placement="center"
      classNames={{ backdrop: "bg-black/50" }}
    >
      <ModalContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
        <ModalHeader className="text-base font-medium text-neutral-900 dark:text-neutral-100">
          Create New Project
        </ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label="Project Name"
            placeholder="Enter project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />
          <Input
            label="Description (optional)"
            placeholder="Enter project description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} disabled={isLoading} size="sm">
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isLoading}
            size="sm"
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            Create Project
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
