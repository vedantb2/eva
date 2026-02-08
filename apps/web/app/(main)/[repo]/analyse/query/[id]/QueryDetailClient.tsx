"use client";

import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useState } from "react";
import {
  ModelSelector,
  type ClaudeModel,
} from "@/lib/components/ui/ModelSelector";
import {
  ResponseLengthSelector,
  type ResponseLength,
} from "@/lib/components/ui/ResponseLengthSelector";
import Image from "next/image";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials } from "@/lib/components/ui/UserInitials";
import {
  Spinner,
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  Message as AIMessage,
  MessageContent,
  MessageResponse,
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@conductor/ui";

interface QueryDetailClientProps {
  queryId: string;
}

export function QueryDetailClient({ queryId }: QueryDetailClientProps) {
  const { repo } = useRepo();
  const typedQueryId = queryId as Id<"researchQueries">;
  const query = useQuery(api.researchQueries.get, { id: typedQueryId });
  const streaming = useQuery(api.streaming.get, { entityId: queryId });
  const [isSending, setIsSending] = useState(false);
  const [model, setModel] = useState<ClaudeModel>("sonnet");
  const [responseLength, setResponseLength] =
    useState<ResponseLength>("default");

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "research/query.execute",
          data: {
            queryId: typedQueryId,
            question: text.trim(),
            repoId: repo._id,
            model,
            responseLength,
          },
        }),
      });
    } finally {
      setIsSending(false);
    }
  };

  if (query === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (query === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          This query does not exist or has been deleted.
        </p>
      </div>
    );
  }

  const handlePromptSubmit = async ({ text }: PromptInputMessage) => {
    await handleSend(text);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {query.title}
        </h1>
      </div>
      <Conversation className="flex-1">
        <ConversationContent className="gap-4 p-6">
          {query.messages.length === 0 ? (
            <ConversationEmptyState title="No messages yet. Start the conversation!" />
          ) : (
            query.messages.map((message, index) => (
              <AIMessage key={index} from={message.role}>
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src="/icon.png"
                        alt="Assistant"
                        width={32}
                        height={32}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Eva
                    </span>
                  </div>
                )}
                <MessageContent
                  className={
                    message.role === "user"
                      ? "rounded-2xl bg-secondary text-foreground px-4 py-3"
                      : "px-1 py-2"
                  }
                >
                  {message.role === "assistant" && !message.content ? (
                    <Reasoning isStreaming defaultOpen>
                      <ReasoningTrigger
                        getThinkingMessage={(isStreaming) =>
                          isStreaming ? "Analysing..." : "Analysis complete"
                        }
                      />
                      <ReasoningContent>
                        {streaming?.currentActivity || "Starting..."}
                      </ReasoningContent>
                    </Reasoning>
                  ) : message.role === "assistant" ? (
                    <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                      {message.content}
                    </MessageResponse>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}
                </MessageContent>
                {message.role === "user" && (
                  <div className="mt-0.5 ml-auto">
                    {message.userId ? (
                      <UserInitials
                        userId={message.userId}
                        hideLastSeen
                        size="md"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">U</span>
                      </div>
                    )}
                  </div>
                )}
              </AIMessage>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="px-5 pb-4">
        <PromptInput onSubmit={handlePromptSubmit}>
          <PromptInputTextarea
            placeholder="Ask Eva to perform an analysis..."
            disabled={isSending}
          />
          <PromptInputFooter>
            <PromptInputTools>
              <ModelSelector
                value={model}
                onChange={setModel}
                isDisabled={isSending}
              />
              <ResponseLengthSelector
                value={responseLength}
                onChange={setResponseLength}
                isDisabled={isSending}
              />
            </PromptInputTools>
            <PromptInputSubmit
              status={isSending ? "submitted" : undefined}
              disabled={isSending}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
