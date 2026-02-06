"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { parseSpec } from "@/lib/utils/parseSpec";
import {
  IconFileText,
  IconMessage,
  IconUser,
  IconRobot,
} from "@tabler/icons-react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import type { ConversationMessage } from "@/lib/components/projects/ProjectChatTab";

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
      <div className="flex justify-between gap-1">
        <Button
          size="sm"
          variant="light"
          radius="full"
          startContent={<IconFileText size={14} />}
          onPress={() => setShowPlanModal(true)}
          isIconOnly
        />
        <Button
          size="sm"
          variant="light"
          radius="full"
          startContent={<IconMessage size={14} />}
          onPress={() => setShowChatModal(true)}
          isIconOnly
        />
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
                <h4 className="font-medium">
                  Tasks ({parsedSpec.tasks.length})
                </h4>
                {parsedSpec.tasks.map((task, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 bg-default-100 rounded"
                  >
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
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    {!isUser && (
                      <div className="mb-1.5 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-default-100 dark:bg-default-800">
                          <IconRobot size={16} className="text-default-500" />
                        </div>
                        <span className="text-xs font-medium text-default-500">Eva</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        isUser
                          ? "bg-primary-500 text-white rounded-br-none"
                          : "bg-default-100 dark:bg-default-800 rounded-tl-none"
                      }`}
                    >
                      {isUser ? (
                        <p className="text-sm whitespace-pre-wrap">
                          {displayContent}
                        </p>
                      ) : (
                        <Streamdown
                          plugins={{ code }}
                          className="prose prose-sm dark:prose-invert max-w-none"
                        >
                          {displayContent}
                        </Streamdown>
                      )}
                    </div>
                    {isUser && (
                      <div className="mt-1.5 w-8 h-8 rounded-full flex items-center justify-center bg-primary-100 dark:bg-primary-900">
                        <IconUser
                          size={16}
                          className="text-primary-600 dark:text-primary-400"
                        />
                      </div>
                    )}
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
