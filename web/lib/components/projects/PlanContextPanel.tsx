"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@heroui/modal";
import { parseSpec } from "@/lib/utils/parseSpec";
import { IconFileText, IconMessage, IconUser, IconRobot } from "@tabler/icons-react";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface PlanContextPanelProps {
  generatedSpec: string;
  conversationHistory: ConversationMessage[];
}

export function PlanContextPanel({
  generatedSpec,
  conversationHistory,
}: PlanContextPanelProps) {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const parsedSpec = (() => {
    try {
      return parseSpec(generatedSpec);
    } catch {
      return null;
    }
  })();

  if (!parsedSpec) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2">
        <Button
          size="sm"
          variant="flat"
          startContent={<IconFileText size={14} />}
          onPress={() => setShowPlanModal(true)}
        >
          View Plan
        </Button>
        <Button
          size="sm"
          variant="flat"
          startContent={<IconMessage size={14} />}
          onPress={() => setShowChatModal(true)}
        >
          View Interview ({conversationHistory.length})
        </Button>
      </div>

      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Plan</ModalHeader>
          <ModalBody className="pb-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{parsedSpec.title}</h3>
                <p className="text-default-500">{parsedSpec.description}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Tasks ({parsedSpec.tasks.length})</h4>
                {parsedSpec.tasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-default-100 rounded">
                    <span className="text-default-400 font-mono">{i + 1}.</span>
                    <span>{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="border-b border-divider">
            <div className="flex items-center gap-2">
              <IconMessage size={20} />
              Interview History
              <span className="text-sm font-normal text-default-400">
                ({conversationHistory.length} messages)
              </span>
            </div>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              {conversationHistory.map((msg, i) => {
                let displayContent = msg.content;
                try {
                  const parsed = JSON.parse(msg.content);
                  if (parsed.question) {
                    displayContent = parsed.question;
                  } else if (parsed.title) {
                    displayContent = `Generated plan: ${parsed.title}`;
                  }
                } catch {
                  // Keep original content
                }
                const isUser = msg.role === "user";
                return (
                  <div
                    key={i}
                    className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isUser
                          ? "bg-primary-100 dark:bg-primary-900"
                          : "bg-default-100 dark:bg-default-800"
                      }`}
                    >
                      {isUser ? (
                        <IconUser size={16} className="text-primary-600 dark:text-primary-400" />
                      ) : (
                        <IconRobot size={16} className="text-default-500" />
                      )}
                    </div>
                    <div
                      className={`flex-1 max-w-[80%] ${isUser ? "text-right" : ""}`}
                    >
                      <div
                        className={`inline-block text-left px-4 py-3 rounded-2xl ${
                          isUser
                            ? "bg-primary-500 text-white rounded-tr-sm"
                            : "bg-default-100 dark:bg-default-800 dark:text-black rounded-tl-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
