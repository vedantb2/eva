import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/chrome-extension";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { ContextPreview } from "./ContextPreview";
import { SelectionTool } from "./SelectionTool";
import { AnnotationTool } from "./AnnotationTool";
import {
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
  ReasoningContent,
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@conductor/ui";
import {
  IconCheck,
  IconChevronRight,
  IconFlag,
  IconLayoutBottombar,
  IconMessageCircle,
  IconUser,
} from "@tabler/icons-react";
import type { ExtractedContext } from "@/shared/types";
import type { Id } from "@conductor/backend";

const API_URL = import.meta.env.VITE_API_URL;

type SessionMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  mode?: "execute" | "ask" | "plan" | "flag";
  activityLog?: string;
  userId?: string;
};

type Mode = "ask" | "flag";

interface ChatPanelProps {
  selectedRepoId: string | null;
  sessionId: string | null;
  capturedContexts: ExtractedContext[];
  onClearContext: (index?: number) => void;
  toolbarVisible: boolean;
  onToggleToolbar: () => void;
}

function UserAvatar({ userId }: { userId?: string }) {
  const user = useQuery(
    api.users.get,
    userId ? { id: userId as Id<"users"> } : "skip",
  );
  if (!user) {
    return (
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
        <IconUser size={14} className="text-neutral-500" />
      </div>
    );
  }
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?";
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
      {initials}
    </div>
  );
}

export function ChatPanel({
  selectedRepoId,
  sessionId,
  capturedContexts,
  onClearContext,
  toolbarVisible,
  onToggleToolbar,
}: ChatPanelProps) {
  const { getToken } = useAuth();
  const [ephemeralMessages, setEphemeralMessages] = useState<SessionMessage[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("ask");
  const [activeTool, setActiveTool] = useState<"select" | "annotate" | null>(
    null,
  );

  const createQuickTask = useMutation(api.agentTasks.createQuickTask);
  const addMessage = useMutation(api.sessions.addMessage).withOptimisticUpdate(
    (localStore, args) => {
      const session = localStore.getQuery(api.sessions.get, { id: args.id });
      if (!session) return;
      localStore.setQuery(
        api.sessions.get,
        { id: args.id },
        {
          ...session,
          messages: [
            ...session.messages,
            {
              role: args.role,
              content: args.content,
              timestamp: Date.now(),
              mode: args.mode,
            },
          ],
        },
      );
    },
  );

  const currentSession = useQuery(
    api.sessions.get,
    sessionId ? { id: sessionId as Id<"sessions"> } : "skip",
  );

  const isLoadingSession = sessionId !== null && currentSession === undefined;
  const messages =
    currentSession?.messages ?? (sessionId ? [] : ephemeralMessages);

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
    async (msg: SessionMessage) => {
      if (sessionId) {
        await addMessage({
          id: sessionId as Id<"sessions">,
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
          repoId: selectedRepoId as Id<"githubRepos">,
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
        const fullMessage = pageUrl
          ? `The user's question comes from this URL. Look into the code in this route and answer based on the code in that folder. URL: ${pageUrl}\n\n${text}`
          : text;

        await appendMessage({
          role: "user",
          content: text,
          timestamp: Date.now(),
          mode: "ask",
        });

        const token = await getToken({ template: "convex" });
        const response = await fetch(`${API_URL}/api/inngest/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: "session/execute",
            data: {
              sessionId,
              message: fullMessage,
              mode: "ask",
            },
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to send message");
        }
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

        await createQuickTask({
          repoId: selectedRepoId as Id<"githubRepos">,
          title: payload.title.slice(0, 100),
          description,
        });
      } catch (error) {
        console.error("Failed to create annotation task:", error);
      }
    },
    [selectedRepoId, createQuickTask],
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
    if (mode === "ask") {
      return capturedContexts.length > 0
        ? `Ask Eva about ${capturedContexts.length} element${capturedContexts.length !== 1 ? "s" : ""}...`
        : "Ask Eva about the codebase...";
    }
    return capturedContexts.length > 0
      ? `Describe the issue with ${capturedContexts.length} element${capturedContexts.length !== 1 ? "s" : ""}...`
      : "Describe an issue to Eva to flag...";
  };

  const isInputDisabled = !selectedRepoId || isLoading || isLoadingSession;

  const handlePromptSubmit = async ({ text }: PromptInputMessage) => {
    await handleSend(text);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Conversation className="flex-1">
        <ConversationContent className="gap-4 p-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                mode === "ask" ? (
                  <IconMessageCircle size={28} className="text-primary" />
                ) : (
                  <IconFlag size={28} className="text-primary" />
                )
              }
              title={
                mode === "ask"
                  ? "Ask Eva questions about your codebase"
                  : capturedContexts.length > 0
                    ? "Describe the issue you want to flag to Eva"
                    : "Flag an issue for Eva"
              }
              description={
                mode === "ask"
                  ? "Get AI-powered answers by Eva"
                  : "Use the select tool to capture element context"
              }
            />
          ) : (
            messages.map((message, index) => {
              const prev = index > 0 ? messages[index - 1] : undefined;
              const isFlagResponse =
                message.role === "assistant" && prev?.mode === "flag";

              return (
                <AIMessage key={index} from={message.role}>
                  {message.role === "assistant" && (
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
                  )}
                  <MessageContent
                    className={
                      message.role === "user"
                        ? "rounded-2xl bg-secondary text-foreground px-4 py-3"
                        : "px-1 py-2"
                    }
                  >
                    {isFlagResponse && prev ? (
                      <Collapsible className="rounded-xl rounded-tl-none border border-border bg-muted text-card-foreground overflow-hidden">
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
                      <Reasoning isStreaming defaultOpen>
                        <ReasoningTrigger
                          getThinkingMessage={(streaming) =>
                            streaming ? "Working..." : "Processing complete"
                          }
                        />
                        <ReasoningContent>
                          {message.activityLog || "Starting..."}
                        </ReasoningContent>
                      </Reasoning>
                    ) : (
                      <>
                        {message.role === "assistant" ? (
                          <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                            {message.content}
                          </MessageResponse>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-sm">
                            {message.content}
                          </p>
                        )}
                        {message.role === "assistant" &&
                          message.activityLog && (
                            <Reasoning defaultOpen={false}>
                              <ReasoningTrigger
                                getThinkingMessage={() => "View logs"}
                              />
                              <ReasoningContent>
                                {message.activityLog}
                              </ReasoningContent>
                            </Reasoning>
                          )}
                      </>
                    )}
                  </MessageContent>
                  {message.role === "user" &&
                    message.mode &&
                    (message.mode === "ask" || message.mode === "flag") && (
                      <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1 ml-auto">
                        {message.mode === "ask" ? (
                          <IconMessageCircle size={12} />
                        ) : (
                          <IconFlag size={12} />
                        )}
                        {message.mode === "ask" ? "Ask" : "Flag"}
                      </span>
                    )}
                  {message.role === "user" && (
                    <div className="mt-0.5 ml-auto">
                      <UserAvatar userId={message.userId} />
                    </div>
                  )}
                </AIMessage>
              );
            })
          )}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role !== "assistant" && (
              <AIMessage from="assistant">
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
                  <Reasoning isStreaming defaultOpen>
                    <ReasoningTrigger
                      getThinkingMessage={(streaming) =>
                        streaming ? "Working..." : "Processing complete"
                      }
                    />
                    <ReasoningContent>Starting...</ReasoningContent>
                  </Reasoning>
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
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v === "flag" ? "flag" : "ask")}
            className="flex-1"
          >
            <TabsList className="w-full">
              <TabsTrigger value="ask" className="flex-1 gap-1.5">
                <IconMessageCircle size={16} />
                Ask
              </TabsTrigger>
              <TabsTrigger value="flag" className="flex-1 gap-1.5">
                <IconFlag size={16} />
                Flag
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <PromptInput onSubmit={handlePromptSubmit}>
          <PromptInputTextarea
            placeholder={getPlaceholder()}
            disabled={isInputDisabled}
          />
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit
              status={isLoading ? "submitted" : undefined}
              disabled={isInputDisabled}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
