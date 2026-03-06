"use client";

import {
  ActivitySteps,
  Avatar,
  AvatarFallback,
  Message as AIMessage,
  MessageContent,
  MessageResponse,
  Reasoning,
  CollapsibleContent,
  ReasoningTrigger,
} from "@conductor/ui";
import Image from "next/image";
import { UserInitials } from "@conductor/shared";
import type { Id } from "@conductor/backend";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";
import { motion } from "motion/react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  logs?: string;
  isStreaming?: boolean;
  userId?: Id<"users">;
}

export function ChatMessage({
  role,
  content,
  logs,
  isStreaming,
  userId,
}: ChatMessageProps) {
  const isUser = role === "user";

  const evaIcon = (
    <Image
      src="/icon.png"
      alt="Eva"
      width={20}
      height={20}
      className="rounded-full"
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <AIMessage from={role}>
        <MessageContent
          className={
            isUser
              ? "rounded-xl bg-secondary text-foreground px-4 py-3"
              : "px-1 py-2"
          }
        >
          {isStreaming ? (
            (() => {
              const steps = parseActivitySteps(content);
              return steps ? (
                <ActivitySteps
                  steps={steps}
                  isStreaming
                  name="Eva"
                  icon={evaIcon}
                />
              ) : (
                <Reasoning isStreaming defaultOpen>
                  <ReasoningTrigger
                    getThinkingMessage={(streaming) =>
                      streaming ? "Working..." : "Processing complete"
                    }
                  />
                  <CollapsibleContent className="mt-4 text-sm text-muted-foreground">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {content || "Starting..."}
                    </pre>
                  </CollapsibleContent>
                </Reasoning>
              );
            })()
          ) : (
            <>
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {content}
                </p>
              ) : (
                <>
                  {logs &&
                    (() => {
                      const steps = parseActivitySteps(logs);
                      return steps ? (
                        <ActivitySteps
                          steps={steps}
                          name="Eva"
                          icon={evaIcon}
                        />
                      ) : (
                        <Reasoning defaultOpen={false}>
                          <ReasoningTrigger
                            getThinkingMessage={() => "View logs"}
                          />
                          <CollapsibleContent className="mt-4 text-sm text-muted-foreground">
                            <pre className="whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto">
                              {logs}
                            </pre>
                          </CollapsibleContent>
                        </Reasoning>
                      );
                    })()}
                  <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                    {content}
                  </MessageResponse>
                </>
              )}
            </>
          )}
        </MessageContent>
        {isUser && (
          <div className="mt-0.5 ml-auto">
            {userId ? (
              <UserInitials userId={userId} hideLastSeen size="md" />
            ) : (
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-secondary text-xs text-muted-foreground">
                  U
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}
      </AIMessage>
    </motion.div>
  );
}
