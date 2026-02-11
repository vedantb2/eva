"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useState } from "react";
import { useQueryStates } from "nuqs";
import { designTabParser, viewModeParser } from "@/lib/search-params";
import Image from "next/image";
import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";
import {
  Button,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  Message as AIMessage,
  MessageContent,
  MessageResponse,
  Reasoning,
  CollapsibleContent,
  ReasoningTrigger,
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@conductor/ui";
import {
  IconCheck,
  IconCode,
  IconDeviceDesktop,
  IconDeviceMobile,
} from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";

interface SandpackConfig {
  stylesCss: string;
  tailwindConfig: string;
  externalResources: string[];
}

type DesignSession = NonNullable<
  FunctionReturnType<typeof api.designSessions.get>
>;
type DesignMessage = DesignSession["messages"][number];
type Variation = NonNullable<DesignMessage["variations"]>[number];

const SUGGESTION_CHIPS = [
  "Make it more minimal",
  "Add more whitespace",
  "Make the colors bolder",
];

export function DesignDetailClient({
  designSessionId,
  sandpackConfig,
}: {
  designSessionId: string;
  sandpackConfig: SandpackConfig;
}) {
  const typedId = designSessionId as Id<"designSessions">;
  const session = useQuery(api.designSessions.get, { id: typedId });
  const streaming = useQuery(api.streaming.get, {
    entityId: designSessionId,
  });
  const { repo } = useRepo();
  const addMessage = useMutation(
    api.designSessions.addMessage,
  ).withOptimisticUpdate((localStore, args) => {
    const s = localStore.getQuery(api.designSessions.get, { id: args.id });
    if (!s) return;
    localStore.setQuery(
      api.designSessions.get,
      { id: args.id },
      {
        ...s,
        messages: [
          ...s.messages,
          { role: args.role, content: args.content, timestamp: Date.now() },
        ],
      },
    );
  });
  const updateLastMessage = useMutation(api.designSessions.updateLastMessage);
  const selectVariation = useMutation(api.designSessions.selectVariation);

  const [isSending, setIsSending] = useState(false);
  const [{ tab, view }, setDesignParams] = useQueryStates({
    tab: designTabParser,
    view: viewModeParser,
  });
  const activeTab = tab;
  const viewMode = view;

  const lastMessage = session?.messages[session.messages.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;
  const isExecuting = isSending || lastAssistantHasNoContent;

  useEffect(() => {
    if (isSending && lastMessage?.role === "assistant" && lastMessage.content) {
      setIsSending(false);
    }
  }, [isSending, lastMessage]);

  const latestVariations = getLatestVariations(session?.messages ?? []);
  const hasSelection =
    session?.selectedCode !== undefined && session?.selectedLabel !== undefined;
  const showSuggestionChips =
    !isExecuting &&
    latestVariations.length > 0 &&
    (session?.messages.filter((m) => m.role === "user").length ?? 0) <= 1;

  const sendToApi = useCallback(
    async (message: string) => {
      const response = await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "design/execute",
          data: { designSessionId, message },
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
    },
    [designSessionId],
  );

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    // Auto-select current tab if variations exist but none selected
    if (latestVariations.length > 0 && !hasSelection) {
      const currentVariation = latestVariations[Number(activeTab)];
      if (currentVariation) {
        await selectVariation({
          id: typedId,
          variationIndex: Number(activeTab),
          code: currentVariation.code,
          label: currentVariation.label,
        });
      }
    }
    setIsSending(true);
    try {
      await addMessage({ id: typedId, role: "user", content: text.trim() });
      await sendToApi(text.trim());
    } catch {
      setIsSending(false);
    }
  };

  const handleCancel = async () => {
    await fetch("/api/inngest/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "design/execute.cancel",
        data: { designSessionId },
      }),
    });
    await updateLastMessage({
      id: typedId,
      content: "Design generation cancelled.",
    });
  };

  const handleSelectVariation = async (index: number) => {
    const variation = latestVariations[index];
    if (!variation) return;
    await selectVariation({
      id: typedId,
      variationIndex: index,
      code: variation.code,
      label: variation.label,
    });
  };

  const handlePromptSubmit = async ({ text }: PromptInputMessage) => {
    await handleSend(text);
  };

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Design session not found</p>
      </div>
    );
  }

  const submitStatus = isExecuting
    ? lastAssistantHasNoContent
      ? "streaming"
      : "submitted"
    : undefined;

  return (
    <div className="flex h-full">
      <div className="flex flex-col w-2/5 min-w-[320px] border-r border-border">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium truncate">{session.title}</h2>
        </div>
        <Conversation className="flex-1">
          <ConversationContent className="gap-4 p-4">
            {session.messages.length === 0 ? (
              <ConversationEmptyState title="Describe the UI you want to design" />
            ) : (
              session.messages.map((message, index) => (
                <AIMessage key={index} from={message.role}>
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden">
                        <Image
                          src="/icon.png"
                          alt="Assistant"
                          width={28}
                          height={28}
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
                          getThinkingMessage={(s) =>
                            s ? "Generating designs..." : "Generation complete"
                          }
                        />
                        <CollapsibleContent className="mt-4 text-sm text-muted-foreground">
                          <pre className="whitespace-pre-wrap font-mono text-xs">
                            {streaming?.currentActivity || "Starting..."}
                          </pre>
                        </CollapsibleContent>
                      </Reasoning>
                    ) : (
                      <>
                        {message.role === "assistant" ? (
                          <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                            {message.content}
                          </MessageResponse>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                        {message.role === "assistant" &&
                          message.activityLog && (
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
                          )}
                      </>
                    )}
                  </MessageContent>
                </AIMessage>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        {hasSelection && (
          <div className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-1.5 border-t border-border">
            <IconCheck size={12} className="text-primary shrink-0" />
            Using &ldquo;{session.selectedLabel}&rdquo; as base for next
            iteration
          </div>
        )}
        {!hasSelection && latestVariations.length > 0 && !isExecuting && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
            Tip: Click &ldquo;Use this design&rdquo; to lock a base, or just
            send a follow-up to iterate on the current tab
          </div>
        )}
        {showSuggestionChips && (
          <div className="flex gap-2 px-4 pb-2 flex-wrap">
            {SUGGESTION_CHIPS.map((chip) => (
              <Button
                key={chip}
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handleSend(chip)}
                disabled={isExecuting}
              >
                {chip}
              </Button>
            ))}
          </div>
        )}
        <div className="px-3 pb-4 pt-3">
          <PromptInput onSubmit={handlePromptSubmit}>
            <PromptInputTextarea
              placeholder="Describe the design you want..."
              disabled={isExecuting}
            />
            <PromptInputFooter>
              <div />
              <PromptInputSubmit
                status={submitStatus}
                onStop={handleCancel}
                disabled={isExecuting}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {latestVariations.length > 0 ? (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setDesignParams({ tab: v })}
            className="flex flex-col h-full"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border">
              <Tabs
                value={viewMode}
                onValueChange={(v) =>
                  setDesignParams({ view: v as "desktop" | "mobile" })
                }
              >
                <TabsList className="h-8">
                  <TabsTrigger value="desktop" className="text-xs px-2">
                    <IconDeviceDesktop size={14} />
                  </TabsTrigger>
                  <TabsTrigger value="mobile" className="text-xs px-2">
                    <IconDeviceMobile size={14} />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <TabsList className="h-8">
                {latestVariations.map((_, i) => (
                  <TabsTrigger
                    key={i}
                    value={String(i)}
                    className="text-xs px-3 gap-1"
                  >
                    {session.selectedVariationIndex === i && (
                      <IconCheck size={12} />
                    )}
                    Design {String.fromCharCode(65 + i)}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                  >
                    <IconCode size={14} />
                    Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>
                      {latestVariations[Number(activeTab)]?.label}
                    </DialogTitle>
                  </DialogHeader>
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-secondary rounded-lg p-4 overflow-auto max-h-[60vh]">
                    {latestVariations[Number(activeTab)]?.code}
                  </pre>
                </DialogContent>
              </Dialog>
            </div>
            {latestVariations.map((variation, i) => (
              <TabsContent
                key={i}
                value={String(i)}
                className="flex-1 m-0 min-h-0 relative bg-muted/30"
              >
                <div
                  className={`[&>.sp-wrapper]:h-full transition-all duration-200 ${viewMode === "mobile" ? "absolute inset-0 mx-auto my-auto max-h-[100%] aspect-[9/16] border border-border rounded-xl overflow-hidden bg-background" : "absolute inset-0"}`}
                >
                  <SandpackProvider
                    template="react-ts"
                    files={{
                      "/App.tsx": variation.code,
                      "/styles.css": {
                        code: sandpackConfig.stylesCss,
                        hidden: true,
                      },
                      "/setupTailwind.js": {
                        code: sandpackConfig.tailwindConfig,
                        hidden: true,
                      },
                      "/index.tsx": {
                        code: `import "./setupTailwind";\nimport "./styles.css";\nimport React, { StrictMode } from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\n\nconst root = createRoot(document.getElementById("root")!);\nroot.render(<StrictMode><App /></StrictMode>);`,
                        hidden: true,
                      },
                    }}
                    options={{
                      externalResources: sandpackConfig.externalResources,
                      visibleFiles: ["/App.tsx"],
                      initMode: "immediate",
                    }}
                    customSetup={{
                      entry: "/index.tsx",
                    }}
                  >
                    <SandpackPreview
                      suppressHydrationWarning
                      showNavigator
                      showOpenNewtab
                      showRestartButton
                      showOpenInCodeSandbox={false}
                      showRefreshButton
                      style={{ height: "100%" }}
                    />
                  </SandpackProvider>
                </div>
              </TabsContent>
            ))}
            <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-border">
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs gap-1 shrink-0"
                onClick={() => handleSelectVariation(Number(activeTab))}
                disabled={session.selectedVariationIndex === Number(activeTab)}
              >
                <IconCheck size={14} />
                {session.selectedVariationIndex === Number(activeTab)
                  ? "Selected"
                  : "Use this design"}
              </Button>
              <p className="text-xs text-muted-foreground truncate">
                {latestVariations[Number(activeTab)]?.label}
              </p>
            </div>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {isExecuting ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner size="md" />
                <p className="text-sm">
                  {streaming?.currentActivity || "Generating designs..."}
                </p>
              </div>
            ) : (
              <p className="text-sm">Send a prompt to generate designs</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getLatestVariations(messages: DesignMessage[]): Variation[] {
  const lastWithVariations = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.variations?.length);
  return lastWithVariations?.variations ?? [];
}
