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
import { useMutation } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useRouter } from "next/navigation";
import { parseSpec } from "@/lib/utils/parseSpec";
import { IconFileText, IconRocket, IconCircleCheck } from "@tabler/icons-react";

interface PlanFinalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: Id<"plans">;
  spec: string;
  repoSlug: string;
}

export function PlanFinalizationModal({
  isOpen,
  onClose,
  planId,
  spec,
  repoSlug,
}: PlanFinalizationModalProps) {
  const router = useRouter();
  const updatePlan = useMutation(api.plans.update);
  const createFromPlan = useMutation(api.features.createFromPlan);
  const [isLoading, setIsLoading] = useState(false);

  const parsedSpec = (() => {
    try {
      return parseSpec(spec);
    } catch {
      return null;
    }
  })();

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      await updatePlan({
        id: planId,
        generatedSpec: spec,
        state: "finalized",
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFeature = async () => {
    setIsLoading(true);
    try {
      await updatePlan({
        id: planId,
        generatedSpec: spec,
      });
      const featureId = await createFromPlan({ planId });
      router.push(`/${repoSlug}/features/${featureId}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!parsedSpec) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" className="sm:max-w-2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-sm sm:text-base">
            <IconCircleCheck size={20} className="text-success flex-shrink-0" />
            Spec Generated
          </span>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-base sm:text-lg">{parsedSpec.title}</h3>
              <p className="text-default-500 text-xs sm:text-sm">
                {parsedSpec.description}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-sm sm:text-base">
                Tasks ({parsedSpec.tasks.length})
              </h4>
              <ul className="space-y-2">
                {parsedSpec.tasks.map((task, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs sm:text-sm bg-default-100 p-2 rounded"
                  >
                    <span className="text-default-400 font-mono flex-shrink-0">{i + 1}.</span>
                    <div className="min-w-0">
                      <span className="font-medium">{task.title}</span>
                      {task.dependencies.length > 0 && (
                        <span className="text-default-400 ml-1 sm:ml-2 block sm:inline">
                          (depends on: {task.dependencies.join(", ")})
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="flat"
            onPress={handleSaveDraft}
            isDisabled={isLoading}
            startContent={<IconFileText size={16} />}
            className="w-full sm:w-auto"
          >
            Save as Draft
          </Button>
          <Button
            color="primary"
            onPress={handleCreateFeature}
            isLoading={isLoading}
            startContent={<IconRocket size={16} />}
            className="w-full sm:w-auto"
          >
            Create Feature
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
