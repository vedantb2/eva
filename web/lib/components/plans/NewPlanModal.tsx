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

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewPlanModal({ isOpen, onClose }: NewPlanModalProps) {
  const { repo, fullName } = useRepo();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createPlan = useMutation(api.plans.create);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !repo) return;

    setIsLoading(true);
    try {
      const planId = await createPlan({
        repoId: repo._id,
        title: title.trim(),
        rawInput: description.trim(),
      });

      await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "plan/index.requested",
          data: {
            planId,
            repoId: repo._id,
            installationId: repo.installationId,
          },
        }),
      });

      setTitle("");
      setDescription("");
      onClose();
      router.push("/" + encodeRepoSlug(fullName) + "/plan/" + planId);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>New Plan</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="Name your feature or plan"
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
            Create Plan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
