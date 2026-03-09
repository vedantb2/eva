"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useEffect, useMemo, useState } from "react";
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
  PromptInputSubmit,
  PromptInputSpeech,
  type PromptInputMessage,
} from "@conductor/ui";
import { IconPlayerPlay, IconPlayerStop } from "@tabler/icons-react";
import { motion } from "motion/react";
import { ChatPageWrapper } from "@/lib/components/ChatPageWrapper";
import { PersonaDropdown, ManagePersonasModal } from "../PersonaSelector";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { UserMessageAvatar } from "@/lib/components/UserMessageAvatar";
import {
  StreamingActivityDisplay,
  ActivityLogDisplay,
} from "@/lib/components/StreamingActivityDisplay";
import { SystemAlertMessage } from "@/lib/components/SystemAlertMessage";
import dayjs from "@conductor/shared/dates";

interface DesignChatPanelProps {
  designSessionId: Id<"designSessions">;
  title: string;
  isArchived: boolean;
  isSandboxActive: boolean;
  isSandboxToggling: boolean;
  isExecuting: boolean;
  onSandboxToggle: (action: "start" | "stop") => void;
  repoId: Id<"githubRepos">;
}

export function DesignChatPanel({
  designSessionId,
  title,
  isArchived,
  isSandboxActive,
  isSandboxToggling,
  isExecuting: parentIsExecuting,
  onSandboxToggle,
  repoId,
}: DesignChatPanelProps) {
  const messages = useQuery(api.messages.listByParent, {
    parentId: designSessionId,
  });
  const streaming = useQuery(api.streaming.get, {
    entityId: designSessionId,
  });
  const personas = useQuery(api.designPersonas.list, { repoId });
  const executeMessage = useMutation(api.designSessions.executeMessage);
  const cancelExecution = useMutation(api.designSessions.cancelExecution);

  const [isSending, setIsSending] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<Id<"designPersonas">>();

  const messagesList = messages ?? [];
  const lastMessage = messagesList[messagesList.length - 1];
  const lastAssistantHasNoContent =
    !!lastMessage && lastMessage.role === "assistant" && !lastMessage.content;

  useEffect(() => {
    if (isSending && lastMessage?.role === "assistant" && lastMessage.content) {
      setIsSending(false);
    }
  }, [isSending, lastMessage]);

  const personaMap = useMemo(
    () => new Map(personas?.map((p) => [p._id, p]) ?? []),
    [personas],
  );

  const evaIcon = <EvaIcon />;

  const isExecuting = isSending || parentIsExecuting;

  const submitStatus = isExecuting
    ? lastAssistantHasNoContent
      ? "streaming"
      : "submitted"
    : undefined;

  const handleSend = async (text: string) => {
    if (!text.trim() || !isSandboxActive) return;
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

  const handlePromptSubmit = async ({ text }: PromptInputMessage) => {
    await handleSend(text);
  };

  return (
    <div className="flex flex-col w-full min-w-0 max-h-[50vh] border-b border-border sm:max-h-[60vh] md:max-h-none md:w-2/5 md:min-w-[280px] lg:min-w-[320px] md:border-b-0 md:border-r">
      <ChatPageWrapper
        title={title}
        isArchived={isArchived}
        headerLeft={
          <Button
            size="icon"
            variant={isSandboxActive ? "destructive" : "secondary"}
            onClick={() => onSandboxToggle(isSandboxActive ? "stop" : "start")}
            disabled={isSandboxToggling}
            className={`motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.97] ${isSandboxActive ? "" : "text-success"}`}
          >
            {isSandboxToggling ? (
              <Spinner size="sm" />
            ) : isSandboxActive ? (
              <IconPlayerStop className="w-4 h-4" />
            ) : (
              <IconPlayerPlay className="w-4 h-4" />
            )}
          </Button>
        }
        headerRight={
          <ManagePersonasModal
            repoId={repoId}
            selectedPersonaId={selectedPersonaId}
            onClearPersona={() => setSelectedPersonaId(undefined)}
          />
        }
      >
        <Conversation className="flex-1 min-h-0">
          <ConversationContent className="gap-3 p-3">
            {messagesList.length === 0 ? (
              <ConversationEmptyState
                title={
                  isSandboxActive
                    ? "Describe the UI you want to design"
                    : "Start the sandbox to begin designing"
                }
              />
            ) : (
              messagesList.map((message) =>
                message.isSystemAlert ? (
                  <SystemAlertMessage
                    key={message._id}
                    content={message.content ?? ""}
                    errorDetail={message.errorDetail}
                  />
                ) : (
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
                ),
              )
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        {!isArchived && (
          <div className="p-2 md:p-3">
            <PromptInput onSubmit={handlePromptSubmit}>
              <PromptInputTextarea
                placeholder={
                  !isSandboxActive
                    ? "Start the sandbox to begin designing..."
                    : "Describe the design you want..."
                }
                disabled={isExecuting || !isSandboxActive}
              />
              <PromptInputFooter>
                <PersonaDropdown
                  repoId={repoId}
                  value={selectedPersonaId}
                  onChange={setSelectedPersonaId}
                />
                <div className="flex items-center gap-1">
                  <PromptInputSpeech
                    disabled={isExecuting || !isSandboxActive}
                  />
                  <PromptInputSubmit
                    status={submitStatus}
                    onStop={handleCancel}
                    disabled={
                      !submitStatus && (isExecuting || !isSandboxActive)
                    }
                    title={submitStatus ? "Stop Eva" : "Send message"}
                  />
                </div>
              </PromptInputFooter>
            </PromptInput>
          </div>
        )}
      </ChatPageWrapper>
    </div>
  );
}
