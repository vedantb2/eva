import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { ContextPreview } from "./ContextPreview";
import { SelectionTool } from "./SelectionTool";
import { AnnotationTool } from "./AnnotationTool";
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
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
  Reasoning,
  ReasoningTrigger,
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
  IconCheck,
  IconChevronRight,
  IconFlag,
  IconLayoutBottombar,
  IconMessageCircle,
  IconCode,
  IconClipboardList,
  IconMessageCircle2,
  IconPlayerStop,
  IconSparkles,
  IconAlertTriangle,
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
  mode?: "execute" | "ask" | "plan" | "flag";
  activityLog?: string;
  userId?: string;
};

type Mode = "execute" | "ask" | "plan" | "flag";

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
  const [mode, setMode] = useState<Mode>("ask");
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

    if (mode === "flag") {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const pageUrl = tab?.url || "";

        await appendMessage({
          role: "user",
          content: text,
          timestamp: Date.now(),
          mode: "flag",
        });

        let fullDescription = text;

        if (pageUrl) {
          fullDescription += `\n\nThis issue must be resolved on the following page: ${pageUrl}

Please review all components and files used on this page before implementing the fix.`;
        }

        for (const ctx of capturedContexts) {
          fullDescription += `\n\n---\n**Captured Element Context**\n`;
          if (ctx.selectedText) {
            fullDescription += `- Selected Text: "${ctx.selectedText}"\n`;
          }
          fullDescription += `- Element: \`<${ctx.element.tagName}>\`\n`;
          fullDescription += `- Selector: \`${ctx.element.selector}\`\n`;
          if (ctx.element.classNames.length > 0) {
            fullDescription += `- Classes: \`${ctx.element.classNames.join(", ")}\`\n`;
          }
        }

        await createQuickTask({
          repoId: selectedRepoId,
          title: text.slice(0, 100),
          description: fullDescription,
        });

        const successMessage = `Issue flagged successfully!${capturedContexts.length > 0 ? `\n\nI've attached ${capturedContexts.length} captured element${capturedContexts.length !== 1 ? "s" : ""} to the task.` : ""}`;

        await appendMessage({
          role: "assistant",
          content: successMessage,
          timestamp: Date.now(),
        });
        onClearContext();
      } catch (error) {
        await appendMessage({
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const pageUrl = tab?.url || "";

        const fullMessage =
          mode === "ask" && pageUrl
            ? `The user's question comes from this URL. Look into the code in this route and answer based on the code in that folder. URL: ${pageUrl}\n\n${text}`
            : text;

        await appendMessage({
          role: "user",
          content: text,
          timestamp: Date.now(),
          mode,
        });

        if (!selectedRepo) throw new Error("Repository not found");
        if (!sessionId) throw new Error("No active session");

        await startExecution({
          sessionId,
          message: fullMessage,
          mode,
          model,
          responseLength,
          installationId: selectedRepo.installationId,
        });
      } catch (error) {
        await appendMessage({
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: Date.now(),
        });
        setIsLoading(false);
      }
    }
  };

  const handleApprovePlan = async () => {
    if (!currentSession?.planContent || !selectedRepo || !sessionId) return;
    setIsLoading(true);
    try {
      await startExecution({
        sessionId,
        message: `Implement the plan:\n\n${currentSession.planContent}`,
        mode: "execute",
        model,
        responseLength,
        installationId: selectedRepo.installationId,
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
    if (mode === "execute") return "Tell Eva what to build or change...";
    if (mode === "ask") {
      return capturedContexts.length > 0
        ? `Ask Eva about ${capturedContexts.length} element${capturedContexts.length !== 1 ? "s" : ""}...`
        : "Ask Eva about the codebase...";
    }
    if (mode === "plan") return "Describe what you want Eva to plan...";
    return capturedContexts.length > 0
      ? `Describe the issue with ${capturedContexts.length} element${capturedContexts.length !== 1 ? "s" : ""}...`
      : "Describe an issue to Eva to flag...";
  };

  const isInputDisabled = !selectedRepoId || isLoading || isLoadingSession;

  const handlePromptSubmit = async ({ text }: PromptInputMessage) => {
    await handleSend(text);
  };

  const handleModeChange = (v: string) => {
    if (v === "execute" || v === "ask" || v === "plan" || v === "flag") {
      setMode(v);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Conversation key={sessionId} className="flex-1">
        <ConversationContent className="gap-4 p-4">
          {currentSession?.planContent && (
            <Collapsible className="rounded-lg border border-primary/30 bg-primary/5 overflow-hidden">
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium hover:bg-primary/10 transition-colors group">
                <IconClipboardList
                  size={16}
                  className="text-primary shrink-0"
                />
                <span className="flex-1 text-left">Plan</span>
                <IconChevronRight
                  size={14}
                  className="text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-3 border-t border-primary/20 pt-2">
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs whitespace-pre-wrap">
                  {currentSession.planContent}
                </div>
                {!isExecutionActive && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={handleApprovePlan}
                    disabled={isLoading}
                  >
                    <IconCode size={14} />
                    Approve & Execute Plan
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

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
              icon={
                mode === "flag" ? (
                  <IconFlag size={28} className="text-primary" />
                ) : (
                  <IconMessageCircle size={28} className="text-primary" />
                )
              }
              title={
                mode === "execute"
                  ? "Tell Eva what to build"
                  : mode === "ask"
                    ? "Ask Eva questions about your codebase"
                    : mode === "plan"
                      ? "Describe what to plan"
                      : capturedContexts.length > 0
                        ? "Describe the issue you want to flag to Eva"
                        : "Flag an issue for Eva"
              }
              description={
                mode === "execute"
                  ? "Eva will write code and push changes"
                  : mode === "ask"
                    ? "Get AI-powered answers by Eva"
                    : mode === "plan"
                      ? "Eva will create a PRD without making changes"
                      : "Use the select tool to capture element context"
              }
            />
          ) : (
            messages.map((message, index) => {
              const prev = index > 0 ? messages[index - 1] : undefined;
              const isFlagResponse =
                message.role === "assistant" && prev?.mode === "flag";
              const isSystemAlert =
                "_id" in message &&
                "isSystemAlert" in message &&
                message.isSystemAlert;

              const key = "_id" in message ? message._id : `ephemeral-${index}`;

              return (
                <AIMessage
                  key={key}
                  from={message.role}
                  className={
                    message.role === "assistant" ? "max-w-full" : undefined
                  }
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2">
                      {isSystemAlert ? (
                        <IconAlertTriangle
                          size={20}
                          className="text-amber-500 flex-shrink-0"
                        />
                      ) : (
                        <img
                          src="/icons/icon.png"
                          alt="Eva"
                          className="flex-shrink-0 w-7 h-7 rounded-full"
                        />
                      )}
                      <span className="text-xs font-medium text-muted-foreground">
                        {isSystemAlert ? "System" : "Eva"}
                      </span>
                    </div>
                  )}
                  <MessageContent
                    className={
                      isSystemAlert
                        ? "rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-3"
                        : message.role === "user"
                          ? "rounded-lg bg-secondary text-foreground px-4 py-3"
                          : "px-1 py-2"
                    }
                  >
                    {isFlagResponse && prev ? (
                      <Collapsible className="rounded-lg rounded-tl-none border border-border bg-muted text-card-foreground overflow-hidden">
                        <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors group">
                          <IconCheck
                            size={16}
                            className="text-primary shrink-0"
                          />
                          <span className="flex-1 text-left">
                            Issue flagged and task created
                          </span>
                          <IconChevronRight
                            size={14}
                            className="text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
                          />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3 text-xs space-y-1.5 border-t border-border pt-2">
                          <p className="font-medium">
                            {prev.content.slice(0, 100)}
                          </p>
                          <p className="text-muted-foreground whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : message.role === "assistant" && !message.content ? (
                      (() => {
                        const steps = parseActivitySteps(streamingActivity);
                        return steps ? (
                          <ActivitySteps steps={steps} isStreaming />
                        ) : (
                          <Reasoning isStreaming defaultOpen>
                            <ReasoningTrigger
                              getThinkingMessage={(streaming) =>
                                streaming ? "Working..." : "Processing complete"
                              }
                            />
                            <CollapsibleContent className="mt-4 text-sm text-muted-foreground">
                              <pre className="whitespace-pre-wrap font-mono text-xs">
                                {streamingActivity ||
                                  message.activityLog ||
                                  "Starting..."}
                              </pre>
                            </CollapsibleContent>
                          </Reasoning>
                        );
                      })()
                    ) : (
                      <>
                        {message.role === "assistant" ? (
                          <>
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
                                  {message.mode === "execute" && (
                                    <>
                                      <IconCode className="w-2.5 h-2.5" />{" "}
                                      Execute
                                    </>
                                  )}
                                  {message.mode === "ask" && (
                                    <>
                                      <IconMessageCircle2 className="w-2.5 h-2.5" />{" "}
                                      Ask
                                    </>
                                  )}
                                  {message.mode === "plan" && (
                                    <>
                                      <IconClipboardList className="w-2.5 h-2.5" />{" "}
                                      PRD
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
                        {message.role === "assistant" &&
                          message.activityLog &&
                          (() => {
                            const steps = parseActivitySteps(
                              message.activityLog,
                            );
                            return steps ? (
                              <ActivitySteps steps={steps} />
                            ) : (
                              <Reasoning defaultOpen={false}>
                                <ReasoningTrigger
                                  getThinkingMessage={() => "View logs"}
                                />
                                <CollapsibleContent className="mt-4 text-sm text-muted-foreground">
                                  <pre className="whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto">
                                    {message.activityLog}
                                  </pre>
                                </CollapsibleContent>
                              </Reasoning>
                            );
                          })()}
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
                <div className="flex items-center gap-2">
                  <img
                    src="/icons/icon.png"
                    alt="Eva"
                    className="flex-shrink-0 w-7 h-7 rounded-full"
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    Eva
                  </span>
                </div>
                <MessageContent className="px-1 py-2">
                  {(() => {
                    const steps = parseActivitySteps(streamingActivity);
                    return steps ? (
                      <ActivitySteps steps={steps} isStreaming />
                    ) : (
                      <Reasoning isStreaming defaultOpen>
                        <ReasoningTrigger
                          getThinkingMessage={(streaming) =>
                            streaming ? "Working..." : "Processing complete"
                          }
                        />
                        <CollapsibleContent className="mt-4 text-sm text-muted-foreground">
                          <pre className="whitespace-pre-wrap font-mono text-xs">
                            {streamingActivity || "Starting..."}
                          </pre>
                        </CollapsibleContent>
                      </Reasoning>
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

        <div className="relative pt-4">
          <Tabs
            value={mode}
            onValueChange={handleModeChange}
            className="absolute left-3 top-4 z-20 -translate-y-1/2"
          >
            <TabsList className="h-8 rounded-full border border-border/70 bg-muted/90 p-0.5 shadow-sm">
              <TabsTrigger
                value="execute"
                className="rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <IconCode className="w-3 h-3" />
                Execute
              </TabsTrigger>
              <TabsTrigger
                value="ask"
                className="rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <IconMessageCircle className="w-3 h-3" />
                Ask
              </TabsTrigger>
              <TabsTrigger
                value="plan"
                className="rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <IconClipboardList className="w-3 h-3" />
                Plan
              </TabsTrigger>
              <TabsTrigger
                value="flag"
                className="rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                <IconFlag className="w-3 h-3" />
                Flag
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <PromptInput onSubmit={handlePromptSubmit}>
            <PromptInputTextarea
              className="pt-8"
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
