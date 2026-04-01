import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  ModelSelect,
  type ClaudeModel,
  type PromptInputMessage,
} from "@conductor/ui";
import {
  IconPlayerPlay,
  IconPlayerStop,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { ChatPageWrapper } from "@/lib/components/ChatPageWrapper";
import { PersonaDropdown, ManagePersonasModal } from "./PersonaSelector";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { UserMessageAvatar } from "@/lib/components/UserMessageAvatar";
import { QueuedMessagesPanel } from "@/lib/components/QueuedMessagesPanel";
import {
  StreamingActivityDisplay,
  ActivityLogDisplay,
} from "@/lib/components/StreamingActivityDisplay";
import { SystemAlertMessage } from "@/lib/components/SystemAlertMessage";
import dayjs from "@conductor/shared/dates";
import {
  getSessionModel,
  useSessionModelSetter,
} from "@/lib/hooks/useSessionSettings";

type QueuedDesignMessage = NonNullable<
  FunctionReturnType<typeof api.queuedMessages.listByParent>
>[number];

interface DesignChatPanelProps {
  designSessionId: Id<"designSessions">;
  title: string;
  isArchived: boolean;
  isSandboxActive: boolean;
  isSandboxToggling: boolean;
  isExecuting: boolean;
  onSandboxToggle: (action: "start" | "stop") => void;
  repoId: Id<"githubRepos">;
  previewCollapsed?: boolean;
  onTogglePreview?: () => void;
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
  previewCollapsed,
  onTogglePreview,
}: DesignChatPanelProps) {
  const messages = useQuery(api.messages.listByParent, {
    parentId: designSessionId,
  });
  const streaming = useQuery(api.streaming.get, {
    entityId: designSessionId,
  });
  const queuedMessages = useQuery(api.queuedMessages.listByParent, {
    parentId: designSessionId,
  });
  const personas = useQuery(api.designPersonas.list, { repoId });
  const executeMessage = useMutation(api.designSessions.executeMessage);
  const enqueueMessage = useMutation(api.designSessions.enqueueMessage);
  const cancelExecution = useMutation(api.designSessions.cancelExecution);
  const updateQueuedMessage = useMutation(api.queuedMessages.update);
  const deleteQueuedMessage = useMutation(api.queuedMessages.remove);

  const [isSending, setIsSending] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<Id<"designPersonas">>();
  const [numDesigns, setNumDesigns] = useState(3);

  const initialModel = useMemo(
    () => getSessionModel(designSessionId, "sonnet"),
    [designSessionId],
  );
  const [model, setModelState] = useState<ClaudeModel>(initialModel);
  const saveModel = useSessionModelSetter(designSessionId);
  const setModel = useCallback(
    (m: ClaudeModel) => {
      setModelState(m);
      saveModel(m);
    },
    [saveModel],
  );

  const messagesList = messages ?? [];
  const lastMessage = messagesList[messagesList.length - 1];

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

  const handleSend = async (text: string) => {
    if (!text.trim() || !isSandboxActive) return;
    if (isExecuting) {
      await enqueueMessage({
        id: designSessionId,
        message: text.trim(),
        personaId: selectedPersonaId,
        numDesigns,
      });
      return;
    }
    setIsSending(true);
    try {
      await executeMessage({
        id: designSessionId,
        message: text.trim(),
        personaId: selectedPersonaId,
        numDesigns,
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

  const queuedMessageItems = useMemo(
    () =>
      (queuedMessages ?? []).map((message: QueuedDesignMessage) => {
        const detailParts = [
          message.personaId
            ? (personaMap.get(message.personaId)?.name ?? "Persona")
            : null,
          typeof message.numDesigns === "number"
            ? `${message.numDesigns} design${message.numDesigns === 1 ? "" : "s"}`
            : null,
        ].filter((part): part is string => Boolean(part));
        return {
          id: message._id,
          content: message.content,
          info: detailParts.length > 0 ? detailParts.join(" / ") : undefined,
        };
      }),
    [personaMap, queuedMessages],
  );

  return (
    <div className="flex flex-col min-w-0 h-full">
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
          <>
            <ManagePersonasModal
              repoId={repoId}
              selectedPersonaId={selectedPersonaId}
              onClearPersona={() => setSelectedPersonaId(undefined)}
            />
            {onTogglePreview && (
              <Button
                size="icon"
                variant="ghost"
                className="size-8 motion-press hover:scale-[1.03] active:scale-[0.97]"
                onClick={onTogglePreview}
                title={
                  previewCollapsed ? "Show preview panel" : "Hide preview panel"
                }
              >
                {previewCollapsed ? (
                  <IconLayoutSidebarRightExpand className="size-4" />
                ) : (
                  <IconLayoutSidebarRightCollapse className="size-4" />
                )}
              </Button>
            )}
          </>
        }
      >
        <Conversation className="flex-1 min-h-0">
          <ConversationContent className="gap-3 p-3 max-w-3xl mx-auto w-full">
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
          <div className="p-2 md:p-3 max-w-3xl mx-auto w-full">
            <QueuedMessagesPanel
              items={queuedMessageItems}
              onEdit={async (id, content) => {
                await updateQueuedMessage({ id, content });
              }}
              onDelete={async (id) => {
                await deleteQueuedMessage({ id });
              }}
            />
            <PromptInput onSubmit={handlePromptSubmit}>
              <PromptInputTextarea
                placeholder={
                  !isSandboxActive
                    ? "Start the sandbox to begin designing..."
                    : "Describe the design you want..."
                }
                disabled={!isSandboxActive}
              />
              <PromptInputFooter>
                <PromptInputTools>
                  <ModelSelect
                    value={model}
                    onValueChange={setModel}
                    disabled={!isSandboxActive}
                  />
                  <PersonaDropdown
                    repoId={repoId}
                    value={selectedPersonaId}
                    onChange={setSelectedPersonaId}
                  />
                </PromptInputTools>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Designs:</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumDesigns(n)}
                      disabled={!isSandboxActive}
                      className={`w-5 h-5 rounded text-xs font-medium transition-colors disabled:opacity-40 ${
                        numDesigns === n
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <PromptInputSpeech disabled={!isSandboxActive} />
                  {isExecuting ? (
                    <Button
                      size="icon-sm"
                      type="button"
                      variant="destructive"
                      onClick={handleCancel}
                      title="Stop Eva"
                    >
                      <IconPlayerStop className="size-4" />
                    </Button>
                  ) : null}
                  <PromptInputSubmit
                    status={
                      isSending && !parentIsExecuting ? "submitted" : undefined
                    }
                    disabled={!isSandboxActive}
                    title={isExecuting ? "Queue message" : "Send message"}
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
