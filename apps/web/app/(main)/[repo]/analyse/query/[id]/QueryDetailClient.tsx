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
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconCheck,
  IconX,
  IconCode,
  IconChevronDown,
  IconBookmark,
  IconBookmarkFilled,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import Image from "next/image";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserInitials } from "@/lib/components/ui/UserInitials";
import {
  Button,
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
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@conductor/ui";

interface QueryDetailClientProps {
  queryId: string;
}

export function QueryDetailClient({ queryId }: QueryDetailClientProps) {
  const { repo } = useRepo();
  const typedQueryId = queryId as Id<"researchQueries">;
  const query = useQuery(api.researchQueries.get, { id: typedQueryId });
  const streaming = useQuery(api.streaming.get, { entityId: queryId });
  const savedQueries = useQuery(api.savedQueries.list, { repoId: repo._id });
  const createSavedQuery = useMutation(api.savedQueries.create);
  const removeSavedQuery = useMutation(api.savedQueries.remove);
  const [isSending, setIsSending] = useState(false);
  const [model, setModel] = useState<ClaudeModel>("sonnet");
  const [responseLength, setResponseLength] =
    useState<ResponseLength>("default");
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const updateMessageStatus = useMutation(
    api.researchQueries.updateMessageStatus,
  );

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "research/query.generate",
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

  const handleConfirm = async (
    messageIndex: number,
    queryCode: string,
    question: string,
  ) => {
    await fetch("/api/inngest/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "research/query.confirm",
        data: {
          queryId: typedQueryId,
          queryCode,
          messageIndex,
          question,
          repoId: repo._id,
        },
      }),
    });
  };

  const handleCancel = async (messageIndex: number) => {
    await updateMessageStatus({
      id: typedQueryId,
      messageIndex,
      status: "cancelled",
    });
  };

  const isQuerySaved = (queryCode: string) =>
    savedQueries?.some((sq) => sq.query === queryCode) ?? false;

  const handleSaveQuery = async (queryCode: string, question: string) => {
    await createSavedQuery({
      repoId: repo._id,
      title: question,
      query: queryCode,
      researchQueryId: typedQueryId,
    });
  };

  const handleRemoveSavedQuery = async (savedQueryId: Id<"savedQueries">) => {
    await removeSavedQuery({ id: savedQueryId });
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
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-border">
        <div className="p-4">
          <h1 className="text-lg font-semibold text-foreground">
            {query.title}
          </h1>
        </div>
        <Conversation className="flex-1">
          <ConversationContent className="gap-4 p-6 justify-end">
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
                    ) : message.role === "assistant" &&
                      message.status === "pending" ? (
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Generated query:
                        </p>
                        <pre className="rounded-lg bg-secondary p-3 text-xs overflow-x-auto">
                          <code>{message.content}</code>
                        </pre>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const userMsg =
                                query.messages[index - 1]?.content ?? "";
                              handleConfirm(index, message.content, userMsg);
                            }}
                          >
                            <IconCheck size={14} />
                            Run query
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(index)}
                          >
                            <IconX size={14} />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : message.role === "assistant" &&
                      message.status === "cancelled" ? (
                      <p className="text-sm text-muted-foreground italic">
                        Query cancelled
                      </p>
                    ) : message.role === "assistant" ? (
                      <div className="space-y-3">
                        <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                          {message.content}
                        </MessageResponse>
                        {message.queryCode && (
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                              <IconCode size={14} />
                              <span>View query</span>
                              <IconChevronDown
                                size={12}
                                className="transition-transform group-data-[state=open]:rotate-180"
                              />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mt-2 space-y-2">
                                <pre className="rounded-lg bg-secondary p-3 text-xs overflow-x-auto">
                                  <code>{message.queryCode}</code>
                                </pre>
                                {isQuerySaved(message.queryCode) ? (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <IconBookmarkFilled size={14} />
                                    <span>Saved</span>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const userMsg =
                                        query.messages[index - 1]?.content ??
                                        query.title;
                                      handleSaveQuery(
                                        message.queryCode ?? "",
                                        userMsg,
                                      );
                                    }}
                                  >
                                    <IconBookmark size={14} />
                                    Save query
                                  </Button>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>
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
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            U
                          </span>
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
      <div
        className={`flex flex-col h-full transition-all duration-200 ${panelCollapsed ? "w-10" : "w-[33%]"}`}
      >
        <div
          className={`flex items-center p-2 ${panelCollapsed ? "justify-center" : ""}`}
        >
          <Button
            size="icon"
            variant="ghost"
            className="text-primary"
            onClick={() => setPanelCollapsed(!panelCollapsed)}
          >
            {panelCollapsed ? (
              <IconLayoutSidebarRightExpand size={16} />
            ) : (
              <IconLayoutSidebarRightCollapse size={16} />
            )}
          </Button>
          {!panelCollapsed && (
            <p className="text-sm font-semibold text-primary">Saved Queries</p>
          )}
        </div>
        {!panelCollapsed && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!savedQueries || savedQueries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <IconBookmark size={20} className="text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground/60">
                  No saved queries yet
                </p>
              </div>
            ) : (
              savedQueries.map((sq) => (
                <div
                  key={sq._id}
                  className="rounded-lg bg-secondary p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-foreground line-clamp-2">
                      {sq.title}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveSavedQuery(sq._id)}
                    >
                      <IconTrash size={12} />
                    </Button>
                  </div>
                  <pre className="rounded bg-background p-2 text-[10px] overflow-x-auto max-h-20">
                    <code>{sq.query}</code>
                  </pre>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
