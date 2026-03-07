"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryStates } from "nuqs";
import { designTabParser, viewModeParser } from "@/lib/search-params";
import {
  Button,
  Spinner,
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
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputSpeech,
  type PromptInputMessage,
} from "@conductor/ui";
import {
  IconCheck,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconPlayerPlay,
  IconPlayerStop,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { ChatPageWrapper } from "@/lib/components/ChatPageWrapper";
import { PersonaDropdown, ManagePersonasModal } from "./PersonaSelector";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { UserMessageAvatar } from "@/lib/components/UserMessageAvatar";
import {
  StreamingActivityDisplay,
  ActivityLogDisplay,
} from "@/lib/components/StreamingActivityDisplay";
import dayjs from "@conductor/shared/dates";

type DesignMessage = NonNullable<
  FunctionReturnType<typeof api.messages.listByParent>
>[number];
type Variation = NonNullable<DesignMessage["variations"]>[number];

const VARIATION_KEYS = ["a", "b", "c"] as const;

export function DesignDetailClient({
  designSessionId,
}: {
  designSessionId: Id<"designSessions">;
}) {
  const session = useQuery(api.designSessions.get, { id: designSessionId });
  const messages = useQuery(api.messages.listByParent, {
    parentId: designSessionId,
  });
  const streaming = useQuery(api.streaming.get, {
    entityId: designSessionId,
  });
  const personas = useQuery(
    api.designPersonas.list,
    session ? { repoId: session.repoId } : "skip",
  );
  const { repo } = useRepo();
  const executeMessage = useMutation(api.designSessions.executeMessage);
  const cancelExecution = useMutation(api.designSessions.cancelExecution);
  const selectVariation = useMutation(api.designSessions.selectVariation);
  const startSandboxMutation = useMutation(api.designSessions.startSandbox);
  const stopSandboxMutation = useMutation(api.designSessions.stopSandbox);
  const getPreviewUrl = useAction(api.daytona.getPreviewUrl);

  const [isSending, setIsSending] = useState(false);
  const [isSandboxStarting, setIsSandboxStarting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<Id<"designPersonas">>();
  const [{ tab, view }, setDesignParams] = useQueryStates({
    tab: designTabParser,
    view: viewModeParser,
  });
  const activeTab = tab;
  const viewMode = view;

  const evaIcon = <EvaIcon />;

  const messagesList = messages ?? [];
  const lastMessage = messagesList[messagesList.length - 1];
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
        port: session.devPort ?? 3000,
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

  const personaMap = useMemo(
    () => new Map(personas?.map((p) => [p._id, p]) ?? []),
    [personas],
  );

  const latestVariations = useMemo(
    () => getLatestVariations(messagesList),
    [messagesList],
  );

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
      await executeMessage({
        id: designSessionId,
        message: text.trim(),
        personaId: selectedPersonaId,
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
        <ChatPageWrapper
          title={session.title}
          isArchived={isArchived}
          headerRight={
            <>
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
              <ManagePersonasModal
                repoId={session.repoId}
                selectedPersonaId={selectedPersonaId}
                onClearPersona={() => setSelectedPersonaId(undefined)}
              />
            </>
          }
        >
          <Conversation className="flex-1 min-h-0">
            <ConversationContent className="gap-3 p-3">
              {messagesList.length === 0 ? (
                <ConversationEmptyState
                  title={
                    sandboxRunning
                      ? "Describe the UI you want to design"
                      : "Start the sandbox to begin designing"
                  }
                />
              ) : (
                messagesList.map((message) => (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <AIMessage from={message.role}>
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
                            name="Eva"
                            icon={evaIcon}
                          />
                        ) : (
                          <>
                            {message.role === "assistant" ? (
                              <>
                                {message.activityLog && (
                                  <ActivityLogDisplay
                                    activityLog={message.activityLog}
                                    name="Eva"
                                    icon={evaIcon}
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
                                  {message.personaId && (
                                    <span className="text-[11px] text-muted-foreground/60">
                                      {personaMap.get(message.personaId)
                                        ?.name ?? "Persona"}
                                    </span>
                                  )}
                                  {message.timestamp && (
                                    <span className="text-[11px] text-muted-foreground/60">
                                      {dayjs(message.timestamp).format(
                                        "h:mm A",
                                      )}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </MessageContent>
                      {message.role === "user" && (
                        <div className="mt-0.5 ml-auto">
                          <UserMessageAvatar userId={message.userId} />
                        </div>
                      )}
                    </AIMessage>
                  </motion.div>
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
        </ChatPageWrapper>
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
    </div>
  );
}

function getLatestVariations(messages: DesignMessage[]): Variation[] {
  const lastWithVariations = [...messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.variations?.length);
  return lastWithVariations?.variations ?? [];
}
