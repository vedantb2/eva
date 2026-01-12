"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@heroui/modal";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { PlanConversation } from "@/lib/components/plan/PlanConversation";

interface PlanInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: Id<"plans">;
}

export function PlanInterviewModal({
  isOpen,
  onClose,
  planId,
}: PlanInterviewModalProps) {
  const plan = useQuery(api.plans.get, { id: planId });

  if (!plan) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" className="sm:max-w-4xl" scrollBehavior="inside">
      <ModalContent className="h-[100vh] sm:h-[80vh]">
        <ModalHeader className="text-sm sm:text-base truncate">{plan.title} - Interview</ModalHeader>
        <ModalBody className="p-0 overflow-hidden">
          <PlanConversation
            planId={planId}
            planState={plan.state}
            initialMessages={plan.conversationHistory}
            autoInterview
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
