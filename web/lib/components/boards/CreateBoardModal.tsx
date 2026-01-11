"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/api";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { Input } from "../ui/Input";

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBoardModal({ isOpen, onClose }: CreateBoardModalProps) {
  const createBoard = useMutation(api.boards.create);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Board name is required");
      return;
    }
    setIsLoading(true);
    setError("");
    await createBoard({ name: name.trim() });
    setIsLoading(false);
    setName("");
    onClose();
  };

  const handleClose = () => {
    setName("");
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
          Create New Board
        </ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label="Board Name"
            placeholder="Enter board name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
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
            Create Board
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
