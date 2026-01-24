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
import { useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useRouter } from "next/navigation";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const { repo, fullName } = useRepo();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createProject = useMutation(api.projects.create);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !repo) return;

    setIsLoading(true);
    try {
      const projectId = await createProject({
        repoId: repo._id,
        title: title.trim(),
        rawInput: description.trim(),
      });

      await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "project/index.requested",
          data: {
            projectId,
            repoId: repo._id,
            installationId: repo.installationId,
          },
        }),
      });

      setTitle("");
      setDescription("");
      onClose();
      router.push("/" + encodeRepoSlug(fullName) + "/projects/" + projectId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>New Project</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="Name your project"
              value={title}
              onValueChange={setTitle}
              autoFocus
            />
            <Textarea
              label="Description"
              placeholder="Describe what you want to build..."
              value={description}
              onValueChange={setDescription}
              minRows={4}
            />
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
            isDisabled={!title.trim() || !description.trim()}
          >
            Create Project
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
