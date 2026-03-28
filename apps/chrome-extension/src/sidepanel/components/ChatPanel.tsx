import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { ContextPreview } from "./ContextPreview";
import { SelectionTool } from "./SelectionTool";
import { AnnotationTool } from "./AnnotationTool";
import {
  Button,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
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
  ActivitySteps,
  Spinner,
  type ClaudeModel,
  type ResponseLength,
  type PromptInputMessage,
} from "@conductor/ui";
import { UserInitials } from "@conductor/shared";
import { parseActivitySteps } from "@/shared/parseActivitySteps";
import dayjs from "@conductor/shared/dates";
import {
  IconChevronRight,
  IconLayoutBottombar,
  IconMessageCircle,
  IconMessageCircle2,
  IconPlayerStop,
  IconSparkles,
} from "@tabler/icons-react";
import type { ExtractedContext } from "@/shared/types";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";

type SessionMessage = NonNullable<
  FunctionReturnType<typeof api.messages.listByParent>
>[number];

type EphemeralMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  mode?: "ask";
  activityLog?: string;
  userId?: string;
};

function formatDuration(startedAt: number, finishedAt: number): string {
  const totalSeconds = Math.round((finishedAt - startedAt) / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

interface ChatPanelProps {
  selectedRepoId: Id<"githubRepos"> | null;
  sessionId: Id<"sessions"> | null;
  capturedContexts: ExtractedContext[];
  onClearContext: (index?: number) => void;
  toolbarVisible: boolean;
  onToggleToolbar: () => void;
  convexUserId?: string;
  creatorInitials?: string;
}

export function ChatPanel({
  selectedRepoId,
  sessionId,
  capturedContexts,
  onClearContext,
  toolbarVisible,
  onToggleToolbar,
  convexUserId,
  creatorInitials,
}: ChatPanelProps) {
  const [ephemeralMessages, setEphemeralMessages] = useState<
    EphemeralMessage[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<ClaudeModel>("sonnet");
  const [responseLength, setResponseLength] =
    useState<ResponseLength>("default");
  const [activeTool, setActiveTool] = useState<"select" | "annotate" | null>(
    null,
  );

  const createQuickTask = useMutation(api.agentTasks.createQuickTask);
  const startExecution = useMutation(api.sessionWorkflow.startExecute);
  const cancelExecution = useMutation(api.sessionWorkflow.cancelExecution);
  const selectedRepo = useQuery(
    api.githubRepos.get,
    selectedRepoId ? { id: selectedRepoId } : "skip",
  );
  const addMessage = useMutation(api.sessions.addMessage);

  const currentSession = useQuery(
    api.sessions.get,
    sessionId ? { id: sessionId } : "skip",
  );

  const sessionMessages = useQuery(
    api.messages.listByParent,
    sessionId ? { parentId: sessionId } : "skip",
  );

  const streaming = useQuery(
    api.streaming.get,
    sessionId ? { entityId: sessionId } : "skip",
  );
  const streamingActivity = streaming?.currentActivity;

  const summaryStreaming = useQuery(
    api.streaming.get,
    sessionId ? { entityId: `summary:${sessionId}` } : "skip",
  );

  const isExecutionActive = Boolean(currentSession?.activeWorkflowId);

  const isLoadingSession = sessionId !== null && currentSession === undefined;
  const isLoadingMessages = sessionId !== null && sessionMessages === undefined;
  const messages: Array<SessionMessage | EphemeralMessage> =
    sessionMessages ?? (sessionId ? [] : ephemeralMessages);

  useEffect(() => {
    if (!isLoading) return;
    if (
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant"
    ) {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const appendMessage = useCallback(
    async (msg: EphemeralMessage) => {
      if (sessionId) {
        await addMessage({
          id: sessionId,
          role: msg.role,
          content: msg.content,
          mode: msg.mode,
        });
      } else {
        setEphemeralMessages((prev) => [...prev, msg]);
      }
    },
    [sessionId, addMessage],
  );

  const handleCancel = useCallback(async () => {
    if (!sessionId) return;
    try {
      await cancelExecution({ sessionId });
      setIsLoading(false);
    } catch (e) {
      console.error("Failed to cancel:", e);
    }
  }, [sessionId, cancelExecution]);

  const handleSend = async (text: string) => {
    if (!text.trim() || !selectedRepoId || isLoading) return;

    setIsLoading(true);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const pageUrl = tab?.url || "";

      const fullMessage = pageUrl
        ? `The user's question comes from this URL. Look into the code in this route and answer based on the code in that folder. URL: ${pageUrl}\n\n${text}`
        : text;

      await appendMessage({
        role: "user",
        content: text,
        timestamp: Date.now(),
        mode: "ask",
      });

      if (!selectedRepo) throw new Error("Repository not found");
      if (!sessionId) throw new Error("No active session");

      await startExecution({
        sessionId,
        message: fullMessage,
        mode: "ask",
        model,
        responseLength,
      });
    } catch (error) {
      await appendMessage({
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: Date.now(),
      });
      setIsLoading(false);
    }
  };

  const handleAnnotationTask = useCallback(
    async (payload: {
      title: string;
      pageUrl: string;
      position: { x: number; y: number };
      pinId: string;
      elementContext?: ExtractedContext;
    }) => {
      if (!selectedRepoId) return;
      try {
        let description = `${payload.title}\n\n**Page:** ${payload.pageUrl}`;

        if (payload.elementContext) {
          const ctx = payload.elementContext;
          description += `\n\n---\n**Captured Element Context**\n`;
          description += `- Element: \`<${ctx.element.tagName}>\`\n`;
          description += `- Selector: \`${ctx.element.selector}\`\n`;
          if (ctx.element.id) {
            description += `- ID: \`${ctx.element.id}\`\n`;
          }
          if (ctx.element.classNames.length > 0) {
            description += `- Classes: \`${ctx.element.classNames.join(", ")}\`\n`;
          }
          if (ctx.metadata.hasReact && ctx.react) {
            description += `\n**React Context**\n`;
            description += `- Component: \`${ctx.react.name || "Unknown"}\`\n`;
            description += `- Total components: ${ctx.metadata.totalComponents}\n`;
            description += `- React version: ${ctx.metadata.reactVersion}\n\n`;
            description += `<details>\n<summary>Full Component Tree</summary>\n\n\`\`\`json\n${JSON.stringify(ctx.react, null, 2)}\n\`\`\`\n</details>`;
          } else {
            description += `\n<details>\n<summary>Element Details</summary>\n\n\`\`\`html\n${ctx.element.outerHTML}\n\`\`\`\n</details>`;
          }
        }

        const taskId = await createQuickTask({
          repoId: selectedRepoId,
          title: payload.title.slice(0, 100),
          description,
        });
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: "ANNOTATION_TASK_CREATED",
              payload: {
                pinId: payload.pinId,
                taskId: String(taskId),
                userId: convexUserId,
                creatorInitials,
              },
            });
          }
        });
      } catch (error) {
        console.error("Failed to create annotation task:", error);
      }
    },
    [selectedRepoId, createQuickTask, convexUserId, creatorInitials],
  );

  const handleSelectionActiveChange = useCallback((active: boolean) => {
    setActiveTool(active ? "select" : null);
  }, []);

  const handleAnnotationActiveChange = useCallback((active: boolean) => {
    setActiveTool(active ? "annotate" : null);
  }, []);

  const getPlaceholder = () => {
    if (!selectedRepoId) return "Select a repository first...";
    if (isLoadingSession) return "Loading session...";
    return capturedContexts.length > 0
      ? `Ask Eva about ${capturedContexts.length} element${capturedContexts.length !== 1 ? "s" : ""}...`
      : "Ask Eva about the codebase...";
  };

  const isInputDisabled = !selectedRepoId || isLoading || isLoadingSession;

  const handlePromptSubmit = async ({ text }: PromptInputMessage) => {
    await handleSend(text);
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
        <IconMessageCircle2
          size={40}
          className="text-muted-foreground/40 mb-3"
        />
        <p className="text-sm text-muted-foreground">
          Create a new session or select one from the sidebar to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Conversation key={sessionId} className="flex-1">
        <ConversationContent className="gap-4 p-4">
          {currentSession?.summary && currentSession.summary.length > 0 && (
            <Collapsible className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors group">
                <IconSparkles size={16} className="text-primary shrink-0" />
                <span className="flex-1 text-left">Summary</span>
                <IconChevronRight
                  size={14}
                  className="text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-3 border-t border-border pt-2 text-sm text-muted-foreground space-y-1">
                {currentSession.summary.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                {summaryStreaming?.currentActivity && (
                  <p className="italic text-xs">
                    {summaryStreaming.currentActivity}
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {isLoadingMessages ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            <ConversationEmptyState
              icon={<IconMessageCircle size={28} className="text-primary" />}
              title="Ask Eva questions about your codebase"
              description="Get AI-powered answers by Eva"
            />
          ) : (
            messages.map((message, index) => {
              const isSystemAlert =
                "_id" in message &&
                "isSystemAlert" in message &&
                message.isSystemAlert;

              const key = "_id" in message ? message._id : `ephemeral-${index}`;

              if (isSystemAlert) {
                return (
                  <div key={key} className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap max-w-[60%] truncate">
                      {message.content}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                );
              }

              const evaIcon = (
                <img
                  src="/icons/icon.png"
                  alt="Eva"
                  className="w-4 h-4 rounded-full"
                />
              );

              const finishedAt =
                "_id" in message &&
                "finishedAt" in message &&
                typeof message.finishedAt === "number"
                  ? message.finishedAt
                  : null;
              const duration =
                finishedAt && message.timestamp
                  ? formatDuration(message.timestamp, finishedAt)
                  : undefined;

              return (
                <AIMessage
                  key={key}
                  from={message.role}
                  className={
                    message.role === "assistant" ? "max-w-full" : undefined
                  }
                >
                  <MessageContent
                    className={
                      message.role === "user"
                        ? "rounded-lg bg-secondary text-foreground px-4 py-3"
                        : "px-1 py-2"
                    }
                  >
                    {message.role === "assistant" && !message.content ? (
                      <ActivitySteps
                        steps={
                          parseActivitySteps(streamingActivity) ?? [
                            {
                              type: "thinking",
                              label: "Working...",
                              status: "active",
                            },
                          ]
                        }
                        isStreaming
                        name="Eva"
                        icon={evaIcon}
                        startedAt={message.timestamp}
                      />
                    ) : (
                      <>
                        {message.role === "assistant" ? (
                          <>
                            {message.activityLog &&
                              (() => {
                                const steps = parseActivitySteps(
                                  message.activityLog,
                                );
                                return steps ? (
                                  <ActivitySteps
                                    steps={steps}
                                    name="Eva"
                                    icon={evaIcon}
                                    startedAt={message.timestamp}
                                    duration={duration}
                                  />
                                ) : null;
                              })()}
                            {"imageUrl" in message && message.imageUrl && (
                              <img
                                src={String(message.imageUrl)}
                                alt="Attached image"
                                className="rounded-lg max-w-full max-h-64 mb-2"
                              />
                            )}
                            {"videoUrl" in message && message.videoUrl && (
                              <video
                                src={String(message.videoUrl)}
                                controls
                                className="rounded-lg max-w-full max-h-64 mb-2"
                              />
                            )}
                            <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                              {message.content}
                            </MessageResponse>
                          </>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between gap-3">
                              {message.mode && (
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                                  {message.mode === "ask" && (
                                    <>
                                      <IconMessageCircle2 className="w-2.5 h-2.5" />{" "}
                                      Ask
                                    </>
                                  )}
                                </div>
                              )}
                              {message.timestamp && (
                                <span className="text-[11px] text-muted-foreground/60">
                                  {dayjs(message.timestamp).format("h:mm A")}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </MessageContent>
                  {message.role === "user" &&
                    "_id" in message &&
                    message.userId && (
                      <div className="mt-0.5 ml-auto">
                        <UserInitials
                          userId={message.userId}
                          hideLastSeen
                          size="md"
                        />
                      </div>
                    )}
                </AIMessage>
              );
            })
          )}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role !== "assistant" && (
              <AIMessage from="assistant" className="max-w-full">
                <MessageContent className="px-1 py-2">
                  {(() => {
                    const loadingEvaIcon = (
                      <img
                        src="/icons/icon.png"
                        alt="Eva"
                        className="w-4 h-4 rounded-full"
                      />
                    );
                    const lastMsg = messages[messages.length - 1];
                    return (
                      <ActivitySteps
                        steps={
                          parseActivitySteps(streamingActivity) ?? [
                            {
                              type: "thinking",
                              label: "Working...",
                              status: "active",
                            },
                          ]
                        }
                        isStreaming
                        name="Eva"
                        icon={loadingEvaIcon}
                        startedAt={lastMsg.timestamp}
                      />
                    );
                  })()}
                </MessageContent>
              </AIMessage>
            )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-4 border-t border-border space-y-3">
        {capturedContexts.map((ctx, i) => (
          <ContextPreview
            key={ctx.metadata.capturedAt}
            context={ctx}
            onClear={() => onClearContext(i)}
          />
        ))}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SelectionTool
              capturedCount={capturedContexts.length}
              isActive={activeTool === "select"}
              onActiveChange={handleSelectionActiveChange}
            />
            <AnnotationTool
              onAnnotationTask={handleAnnotationTask}
              isActive={activeTool === "annotate"}
              onActiveChange={handleAnnotationActiveChange}
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleToolbar}
                className={`relative p-2 rounded-lg transition-all duration-200 ${
                  toolbarVisible
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <IconLayoutBottombar className="relative w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {toolbarVisible ? "Hide toolbar" : "Show toolbar"}
            </TooltipContent>
          </Tooltip>
        </div>

        <div>
          <PromptInput onSubmit={handlePromptSubmit}>
            <PromptInputTextarea
              placeholder={getPlaceholder()}
              disabled={isInputDisabled}
            />
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputSettings
                  model={model}
                  onModelChange={setModel}
                  responseLength={responseLength}
                  onResponseLengthChange={setResponseLength}
                  disabled={isInputDisabled}
                />
              </PromptInputTools>
              <div className="flex items-center gap-1">
                <PromptInputSpeech disabled={isInputDisabled} />
                {isLoading || isExecutionActive ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleCancel}
                      >
                        <IconPlayerStop size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Cancel execution</TooltipContent>
                  </Tooltip>
                ) : (
                  <PromptInputSubmit disabled={isInputDisabled} />
                )}
              </div>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
