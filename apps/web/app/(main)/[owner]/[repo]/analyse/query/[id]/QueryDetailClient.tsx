"use client";

import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ClaudeModel, ResponseLength } from "@conductor/ui";
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconCheck,
  IconX,
  IconBookmark,
  IconBookmarkFilled,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { UserMessageAvatar } from "@/lib/components/UserMessageAvatar";
import { EvaIcon } from "@/lib/components/EvaIcon";
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
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputSpeech,
  PromptInputSettings,
  type PromptInputMessage,
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent,
  CodeBlock,
  CodeBlockCopyButton,
  Sandbox,
  SandboxContent,
  SandboxTabs,
  SandboxTabsList,
  SandboxTabsTrigger,
  SandboxTabContent,
  ActivitySteps,
} from "@conductor/ui";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";
import { StreamingActivityDisplay } from "@/lib/components/StreamingActivityDisplay";
import type { FunctionReturnType } from "convex/server";

type QueryMessage = NonNullable<
  FunctionReturnType<typeof api.messages.listByParent>
>[number];

interface QueryDetailClientProps {
  queryId: Id<"researchQueries">;
}

export function QueryDetailClient({ queryId }: QueryDetailClientProps) {
  const { repo } = useRepo();
  const researchQuery = useQuery(api.researchQueries.get, {
    id: queryId,
  });
  const messages = useQuery(api.messages.listByParent, {
    parentId: queryId,
  });
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
  const startGenerate = useMutation(api.researchQueryWorkflow.startGenerate);
  const startConfirm = useMutation(api.researchQueryWorkflow.startConfirm);

  const messagesList = messages ?? [];

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      await startGenerate({
        queryId: queryId,
        question: text.trim(),
        repoId: repo._id,
        model,
        installationId: repo.installationId,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirm = async (
    messageId: Id<"messages">,
    queryCode: string,
    question: string,
  ) => {
    await startConfirm({
      queryId: queryId,
      queryCode,
      messageId,
      question,
      repoId: repo._id,
      installationId: repo.installationId,
    });
  };

  const handleCancel = async (messageId: Id<"messages">) => {
    await updateMessageStatus({
      id: queryId,
      messageId,
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
      researchQueryId: queryId,
    });
  };

  const handleRemoveSavedQuery = async (savedQueryId: Id<"savedQueries">) => {
    await removeSavedQuery({ id: savedQueryId });
  };

  if (researchQuery === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (researchQuery === null) {
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

  const getPreviousUserContent = (
    msgs: QueryMessage[],
    currentIndex: number,
  ): string => {
    const prev = currentIndex > 0 ? msgs[currentIndex - 1] : undefined;
    return prev?.content ?? researchQuery.title;
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-4">
          <h1 className="text-lg font-semibold text-foreground">
            {researchQuery.title}
          </h1>
        </div>
        <Conversation className="flex-1">
          <ConversationContent className="gap-4 p-6 justify-end">
            {messagesList.length === 0 ? (
              <ConversationEmptyState title="No messages yet. Start the conversation!" />
            ) : (
              messagesList.map((message, index) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                >
                  <AIMessage from={message.role}>
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2">
                        <EvaIcon size={32} />
                        <span className="text-xs font-medium text-muted-foreground">
                          Eva
                        </span>
                      </div>
                    )}
                    <MessageContent
                      className={
                        message.role === "user"
                          ? "rounded-xl bg-secondary text-foreground px-4 py-3"
                          : "px-1 py-2"
                      }
                    >
                      {message.role === "assistant" && !message.content ? (
                        <StreamingActivityDisplay
                          activity={streaming?.currentActivity}
                          thinkingLabel="Analysing..."
                          doneLabel="Analysis complete"
                        />
                      ) : message.role === "assistant" &&
                        message.status === "pending" ? (
                        <>
                          <Confirmation state="pending">
                            <ConfirmationTitle>
                              <p className="text-xs font-medium text-muted-foreground">
                                Generated query:
                              </p>
                            </ConfirmationTitle>
                            <ConfirmationRequest>
                              <CodeBlock
                                code={message.content}
                                language="typescript"
                              >
                                <CodeBlockCopyButton />
                                <pre className="overflow-x-auto p-3 text-xs">
                                  <code>{message.content}</code>
                                </pre>
                              </CodeBlock>
                            </ConfirmationRequest>
                            <ConfirmationActions>
                              <ConfirmationAction
                                variant="outline"
                                onClick={() => handleCancel(message._id)}
                              >
                                <IconX size={14} />
                                Cancel
                              </ConfirmationAction>
                              <ConfirmationAction
                                onClick={() => {
                                  const userMsg = getPreviousUserContent(
                                    messagesList,
                                    index,
                                  );
                                  handleConfirm(
                                    message._id,
                                    message.content,
                                    userMsg,
                                  );
                                }}
                              >
                                <IconCheck size={14} />
                                Run query
                              </ConfirmationAction>
                            </ConfirmationActions>
                          </Confirmation>
                          {message.activityLog &&
                            (() => {
                              const steps = parseActivitySteps(
                                message.activityLog,
                              );
                              return steps ? (
                                <details className="mt-2 group">
                                  <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
                                    Generation logs
                                  </summary>
                                  <div className="mt-2">
                                    <ActivitySteps steps={steps} />
                                  </div>
                                </details>
                              ) : null;
                            })()}
                        </>
                      ) : message.role === "assistant" &&
                        message.status === "cancelled" ? (
                        <Confirmation state="rejected">
                          <ConfirmationRejected>
                            <p className="text-sm text-muted-foreground italic">
                              Query cancelled
                            </p>
                          </ConfirmationRejected>
                        </Confirmation>
                      ) : message.role === "assistant" ? (
                        message.queryCode ? (
                          <Sandbox state="completed">
                            <SandboxContent>
                              <SandboxTabs defaultValue="output">
                                <SandboxTabsList>
                                  <SandboxTabsTrigger value="output">
                                    Output
                                  </SandboxTabsTrigger>
                                  <SandboxTabsTrigger value="code">
                                    Code
                                  </SandboxTabsTrigger>
                                  {message.activityLog && (
                                    <SandboxTabsTrigger value="logs">
                                      Logs
                                    </SandboxTabsTrigger>
                                  )}
                                </SandboxTabsList>
                                <SandboxTabContent value="output">
                                  <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                                    {message.content}
                                  </MessageResponse>
                                </SandboxTabContent>
                                <SandboxTabContent value="code">
                                  <CodeBlock
                                    code={message.queryCode}
                                    language="typescript"
                                  >
                                    <CodeBlockCopyButton />
                                    <pre className="overflow-x-auto p-3 text-xs">
                                      <code>{message.queryCode}</code>
                                    </pre>
                                  </CodeBlock>
                                  <div className="mt-2">
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
                                            getPreviousUserContent(
                                              messagesList,
                                              index,
                                            );
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
                                </SandboxTabContent>
                                {message.activityLog && (
                                  <SandboxTabContent value="logs">
                                    <div className="p-3">
                                      <ActivitySteps
                                        steps={
                                          parseActivitySteps(
                                            message.activityLog,
                                          ) ?? []
                                        }
                                      />
                                    </div>
                                  </SandboxTabContent>
                                )}
                              </SandboxTabs>
                            </SandboxContent>
                          </Sandbox>
                        ) : (
                          <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                            {message.content}
                          </MessageResponse>
                        )
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                    </MessageContent>
                    {message.role === "user" && (
                      <div className="mt-0.5 ml-auto">
                        <UserMessageAvatar
                          userId={message.userId}
                          className="h-8 w-8"
                        />
                      </div>
                    )}
                  </AIMessage>
                </motion.div>
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
                <PromptInputSettings
                  model={model}
                  onModelChange={setModel}
                  responseLength={responseLength}
                  onResponseLengthChange={setResponseLength}
                  disabled={isSending}
                />
              </PromptInputTools>
              <div className="flex items-center gap-1">
                <PromptInputSpeech disabled={isSending} />
                <PromptInputSubmit
                  status={isSending ? "submitted" : undefined}
                  disabled={isSending}
                />
              </div>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
      <div
        className={`flex h-full flex-col overflow-hidden border-l border-border/60 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${panelCollapsed ? "w-12" : "w-[33%]"}`}
      >
        <div
          className={`flex items-center p-2 ${panelCollapsed ? "justify-center" : ""}`}
        >
          <Button
            size="icon"
            variant="ghost"
            className="motion-press text-primary hover:scale-[1.03] active:scale-[0.97]"
            onClick={() => setPanelCollapsed(!panelCollapsed)}
          >
            {panelCollapsed ? (
              <IconLayoutSidebarRightExpand size={16} />
            ) : (
              <IconLayoutSidebarRightCollapse size={16} />
            )}
          </Button>
          <AnimatePresence initial={false}>
            {!panelCollapsed && (
              <motion.p
                className="text-sm font-semibold text-primary"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
              >
                Saved Queries
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence initial={false}>
          {!panelCollapsed && (
            <motion.div
              key="saved-queries-panel-content"
              className="flex-1 overflow-y-auto p-3 space-y-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {!savedQueries || savedQueries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <IconBookmark size={20} className="text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    No saved queries yet
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {savedQueries.map((sq) => (
                    <motion.div
                      key={sq._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Artifact>
                        <ArtifactHeader className="px-3 py-2">
                          <ArtifactTitle className="line-clamp-2 text-xs">
                            {sq.title}
                          </ArtifactTitle>
                          <ArtifactActions>
                            <ArtifactAction
                              tooltip="Delete"
                              className="size-6 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveSavedQuery(sq._id)}
                            >
                              <IconTrash size={12} />
                            </ArtifactAction>
                          </ArtifactActions>
                        </ArtifactHeader>
                        <ArtifactContent className="p-2">
                          <CodeBlock
                            code={sq.query}
                            language="typescript"
                            className="max-h-20 overflow-hidden"
                          />
                        </ArtifactContent>
                      </Artifact>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
