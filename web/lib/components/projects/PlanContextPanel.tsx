"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@conductor/ui";
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
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={() => setShowPlanModal(true)}
        >
          <IconFileText size={14} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={() => setShowChatModal(true)}
        >
          <IconMessage size={14} />
        </Button>
      </div>

      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{parsedSpec.title}</h3>
              <p className="text-muted-foreground">{parsedSpec.description}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Tasks ({parsedSpec.tasks.length})</h4>
              {parsedSpec.tasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 bg-muted rounded"
                >
                  <span className="text-muted-foreground font-mono">
                    {i + 1}.
                  </span>
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle>
              <div className="flex items-center gap-2">
                <IconMessage size={20} />
                Interview History
                <span className="text-sm font-normal text-muted-foreground">
                  ({conversationHistory.length} messages)
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                        <IconRobot
                          size={16}
                          className="text-muted-foreground"
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Eva
                      </span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      isUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-tl-none"
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
                    <div className="mt-1.5 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                      <IconUser size={16} className="text-primary" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
