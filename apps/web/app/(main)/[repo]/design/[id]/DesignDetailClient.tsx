"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useState } from "react";
import { useQueryStates } from "nuqs";
import { designTabParser, viewModeParser } from "@/lib/search-params";
import Image from "next/image";
import {
  Button,
  Spinner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  Message as AIMessage,
  MessageContent,
  MessageResponse,
  ActivitySteps,
  type ActivityStep,
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputSpeech,
  type PromptInputMessage,
} from "@conductor/ui";
import {
  IconArchive,
  IconCheck,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconPlayerPlay,
  IconPlayerStop,
  IconTrash,
} from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PersonaDropdown, ManagePersonasModal } from "./PersonaSelector";
import { useConvexToken } from "@/lib/hooks/useConvexToken";
import dayjs from "@conductor/shared/dates";

type DesignSession = NonNullable<
  FunctionReturnType<typeof api.designSessions.get>
>;
type DesignMessage = DesignSession["messages"][number];
type Variation = NonNullable<DesignMessage["variations"]>[number];

const STARTING_STEPS: ActivityStep[] = [
  { type: "thinking", label: "Starting...", status: "active" },
];

function parseActivitySteps(raw: string | undefined): ActivityStep[] {
  if (!raw) return STARTING_STEPS;
  try {
    const parsed: Array<Record<string, string>> = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return STARTING_STEPS;
    return parsed.map((s) => ({
      type: (s.type ?? "tool") as ActivityStep["type"],
      label: s.label ?? "",
      detail: s.detail,
      status: (s.status ?? "complete") as ActivityStep["status"],
    }));
  } catch {
    return STARTING_STEPS;
  }
}

const VARIATION_KEYS = ["a", "b", "c"] as const;

export function DesignDetailClient({
  designSessionId,
}: {
  designSessionId: Id<"designSessions">;
}) {
  const session = useQuery(api.designSessions.get, { id: designSessionId });
  const streaming = useQuery(api.streaming.get, {
    entityId: designSessionId,
  });
  const personas = useQuery(
    api.designPersonas.list,
    session ? { repoId: session.repoId } : "skip",
  );
  const { repo } = useRepo();
  const getConvexToken = useConvexToken();
  const executeMessage = useMutation(
    api.designSessions.executeMessage,
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
          {
            role: "user",
            content: args.message,
            timestamp: Date.now(),
            personaId: args.personaId,
          },
        ],
      },
    );
  });
  const clearMessages = useMutation(api.designSessions.clearMessages);
  const cancelExecution = useMutation(api.designSessions.cancelExecution);
  const selectVariation = useMutation(api.designSessions.selectVariation);
  const startSandboxMutation = useMutation(api.designSessions.startSandbox);
  const stopSandboxMutation = useMutation(api.designSessions.stopSandbox);
  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);

  const [isSending, setIsSending] = useState(false);
  const [isSandboxStarting, setIsSandboxStarting] = useState(false);
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<Id<"designPersonas">>();
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

  const sandboxRunning = !!session?.sandboxId;

  useEffect(() => {
    if (isSending && lastMessage?.role === "assistant" && lastMessage.content) {
      setIsSending(false);
    }
  }, [isSending, lastMessage]);

  useEffect(() => {
    if (isSandboxStarting && session?.sandboxId) {
      setIsSandboxStarting(false);
    }
  }, [isSandboxStarting, session?.sandboxId]);

  const fetchPreviewUrl = useCallback(async () => {
    if (!session?.sandboxId) {
      setPreviewUrl(null);
      return;
    }
    try {
      const data = await getPreviewUrl({
        sandboxId: session.sandboxId,
        port: 3000,
        repoId: session.repoId,
      });
      setPreviewUrl(data.url);
    } catch {
      setPreviewUrl(null);
    }
  }, [session?.sandboxId, getPreviewUrl, session?.repoId]);

  useEffect(() => {
    fetchPreviewUrl();
  }, [fetchPreviewUrl]);

  const latestVariations = getLatestVariations(session?.messages ?? []);

  const handleStartSandbox = async () => {
    setIsSandboxStarting(true);
    try {
      await startSandboxMutation({
        id: designSessionId,
        installationId: repo.installationId,
      });
    } catch {
      setIsSandboxStarting(false);
    }
  };

  const handleStopSandbox = async () => {
    await stopSandboxMutation({ id: designSessionId });
    setPreviewUrl(null);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !sandboxRunning) return;
    setIsSending(true);
    try {
      const convexToken = await getConvexToken();

      await executeMessage({
        id: designSessionId,
        message: text.trim(),
        personaId: selectedPersonaId,
        convexToken,
      });
    } catch {
      setIsSending(false);
    }
  };

  const handleCancel = async () => {
    await cancelExecution({ id: designSessionId });
  };

  const handleSelectVariation = async (index: number) => {
    await selectVariation({ id: designSessionId, variationIndex: index });
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

  const isArchived = session.archived === true;

  const submitStatus = isExecuting
    ? lastAssistantHasNoContent
      ? "streaming"
      : "submitted"
    : undefined;

  return (
    <div className="flex h-full">
      <div className="flex flex-col w-2/5 min-w-[320px] border-r border-border">
        {isArchived && (
          <div className="flex items-center gap-2 px-4 py-5 border-b border-border bg-muted/50">
            <IconArchive size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              This session is archived and read-only
            </span>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <h2 className="text-sm font-medium truncate">{session.title}</h2>
          {!isArchived && (
            <div className="flex items-center gap-2">
              {sandboxRunning ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1"
                  onClick={handleStopSandbox}
                >
                  <IconPlayerStop size={14} />
                  Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1"
                  onClick={handleStartSandbox}
                  disabled={isSandboxStarting}
                >
                  <IconPlayerPlay size={14} />
                  {isSandboxStarting ? "Starting..." : "Start sandbox"}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 text-destructive"
                onClick={() => setShowClearChatModal(true)}
                disabled={session.messages.length === 0}
                title="Clear chat"
              >
                <IconTrash size={14} />
              </Button>
              <ManagePersonasModal
                repoId={session.repoId}
                selectedPersonaId={selectedPersonaId}
                onClearPersona={() => setSelectedPersonaId(undefined)}
              />
            </div>
          )}
        </div>
        <Conversation className="flex-1">
          <ConversationContent className="gap-4 p-4">
            {session.messages.length === 0 ? (
              <ConversationEmptyState
                title={
                  sandboxRunning
                    ? "Describe the UI you want to design"
                    : "Start the sandbox to begin designing"
                }
              />
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
                        ? "rounded-xl bg-secondary text-foreground px-4 py-3"
                        : "px-1 py-2"
                    }
                  >
                    {message.role === "assistant" && !message.content ? (
                      <ActivitySteps
                        steps={parseActivitySteps(streaming?.currentActivity)}
                        isStreaming
                      />
                    ) : (
                      <>
                        {message.role === "assistant" ? (
                          <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                            {message.content}
                          </MessageResponse>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between gap-3">
                              {message.personaId && (
                                <span className="text-[11px] text-muted-foreground/60">
                                  {personas?.find(
                                    (p) => p._id === message.personaId,
                                  )?.name ?? "Persona"}
                                </span>
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
                          message.activityLog && (
                            <ActivitySteps
                              steps={parseActivitySteps(message.activityLog)}
                            />
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
        {!isArchived && (
          <div className="px-3 pb-4 pt-3">
            <PromptInput onSubmit={handlePromptSubmit}>
              <PromptInputTextarea
                placeholder={
                  !sandboxRunning
                    ? "Start the sandbox to begin designing..."
                    : "Describe the design you want..."
                }
                disabled={isExecuting || !sandboxRunning}
              />
              <PromptInputFooter>
                <PersonaDropdown
                  repoId={session.repoId}
                  value={selectedPersonaId}
                  onChange={setSelectedPersonaId}
                />
                <div className="flex items-center gap-1">
                  <PromptInputSpeech
                    disabled={isExecuting || !sandboxRunning}
                  />
                  <PromptInputSubmit
                    status={submitStatus}
                    onStop={handleCancel}
                    disabled={isExecuting || !sandboxRunning}
                  />
                </div>
              </PromptInputFooter>
            </PromptInput>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {latestVariations.length > 0 ? (
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              if (v === "0" || v === "1" || v === "2") {
                setDesignParams({ tab: v });
              }
            }}
            className="flex flex-col h-full"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border">
              <Tabs
                value={viewMode}
                onValueChange={(v) => {
                  if (v === "desktop" || v === "mobile") {
                    setDesignParams({ view: v });
                  }
                }}
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
                    className="text-xs px-3"
                  >
                    Design {String.fromCharCode(65 + i)}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="w-16" />
            </div>
            {latestVariations.map((variation, i) => (
              <TabsContent
                key={i}
                value={String(i)}
                className="flex-1 m-0 min-h-0 relative bg-muted/30"
              >
                <div
                  className={`transition-all duration-150 ${viewMode === "mobile" ? "absolute inset-0 mx-auto my-auto max-h-[100%] aspect-[9/16] border border-border rounded-xl overflow-hidden bg-background" : "absolute inset-0"}`}
                >
                  {previewUrl ? (
                    <iframe
                      src={`${previewUrl}/design-preview?v=${VARIATION_KEYS[i] ?? "a"}`}
                      className="w-full h-full border-0"
                      title={variation.label}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        {sandboxRunning ? (
                          <Spinner size="md" />
                        ) : (
                          <>
                            <p className="text-sm mb-2">
                              {isArchived
                                ? "Sandbox not available for archived sessions"
                                : "Sandbox not running"}
                            </p>
                            {!isArchived && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleStartSandbox}
                                disabled={isSandboxStarting}
                              >
                                <IconPlayerPlay size={14} />
                                {isSandboxStarting
                                  ? "Starting..."
                                  : "Start sandbox"}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
            <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-border">
              {!isArchived && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs gap-1 shrink-0"
                  onClick={() => handleSelectVariation(Number(activeTab))}
                  disabled={
                    session.selectedVariationIndex === Number(activeTab)
                  }
                >
                  <IconCheck size={14} />
                  {session.selectedVariationIndex === Number(activeTab)
                    ? "Selected"
                    : "Use this design"}
                </Button>
              )}
              <p className="text-xs text-muted-foreground truncate">
                {latestVariations[Number(activeTab)]?.label}
              </p>
            </div>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">
              {isExecuting
                ? "Generating designs..."
                : "Send a prompt to generate designs"}
            </p>
          </div>
        )}
      </div>
      <Dialog
        open={showClearChatModal}
        onOpenChange={(v) => {
          if (!v) setShowClearChatModal(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Chat</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to clear all messages? This will also remove
            any generated designs. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowClearChatModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await clearMessages({ id: designSessionId });
                setShowClearChatModal(false);
              }}
            >
              Clear Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getLatestVariations(messages: DesignMessage[]): Variation[] {
  const lastWithVariations = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.variations?.length);
  return lastWithVariations?.variations ?? [];
}
