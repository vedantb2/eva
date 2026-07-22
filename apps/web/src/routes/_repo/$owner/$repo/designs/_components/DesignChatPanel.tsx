import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import {
  api,
  getModelTraits,
  getReasoningLevelLabel,
  modelHasTraits,
  type Id,
} from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useRef, useState } from "react";
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
  PromptInputProvider,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputSpeech,
  ModelSelect,
  TraitsMenu,
  toast,
  type PromptInputMessage,
} from "@conductor/ui";
import {
  MAX_IMAGE_ATTACHMENTS,
  MAX_IMAGE_ATTACHMENT_BYTES,
  imageAttachmentErrorMessage,
  useUploadImageAttachments,
  ChatAttachmentPreview,
  UserMessageAttachments,
} from "@/lib/components/chat/imageAttachments";
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
import { useSessionSettings } from "@/lib/hooks/useSessionSettings";
import {
  useAvailableAiModels,
  useProviderAccounts,
} from "@/lib/hooks/useAvailableAiModels";
import { useRepo } from "@/lib/contexts/RepoContext";
import { MessageMentionText } from "@/lib/components/chat/MessageMentionText";
import { tokenizedToEditable } from "@/lib/components/mentions";
import {
  MentionTextarea,
  type MentionTextareaHandle,
} from "@/lib/components/chat/MentionTextarea";
import { useChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import { ChatDraftSync } from "@/lib/components/chat/ChatDraftSync";
import { ComposerPlusMenu } from "@/lib/components/chat/_components/ComposerPlusMenu";

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
  const docs = useQuery(api.docs.list, { repoId }) ?? [];
  const skills = useQuery(api.repoSkills.listByRepo, { repoId }) ?? [];
  const executeMessage = useMutation(api.designSessions.executeMessage);
  const enqueueMessage = useMutation(api.designSessions.enqueueMessage);
  const cancelExecution = useMutation(api.designSessions.cancelExecution);
  const updateQueuedMessage = useMutation(
    api.queuedMessages.update,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.queuedMessages.listByParent, {
      parentId: designSessionId,
    });
    if (current !== undefined) {
      localStore.setQuery(
        api.queuedMessages.listByParent,
        { parentId: designSessionId },
        current.map((m) =>
          m._id === args.id ? { ...m, content: args.content } : m,
        ),
      );
    }
  });
  const deleteQueuedMessage = useMutation(
    api.queuedMessages.remove,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.queuedMessages.listByParent, {
      parentId: designSessionId,
    });
    if (current !== undefined) {
      localStore.setQuery(
        api.queuedMessages.listByParent,
        { parentId: designSessionId },
        current.filter((m) => m._id !== args.id),
      );
    }
  });
  const reorderQueuedMessages = useMutation(
    api.queuedMessages.reorder,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.queuedMessages.listByParent, {
      parentId: designSessionId,
    });
    if (current === undefined) return;
    const byId = new Map(current.map((m) => [m._id, m]));
    const reordered = args.orderedIds
      .map((id) => byId.get(id))
      .filter((m): m is (typeof current)[number] => m !== undefined);
    localStore.setQuery(
      api.queuedMessages.listByParent,
      { parentId: designSessionId },
      reordered,
    );
  });
  const { basePath } = useRepo();

  const mentionRef = useRef<MentionTextareaHandle>(null);
  const uploadImageAttachments = useUploadImageAttachments();
  const [isSending, setIsSending] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] =
    useState<Id<"designPersonas">>();
  const [numDesigns, setNumDesigns] = useState(3);

  const {
    model,
    setModel,
    displayTraits,
    executionTraits,
    onTraitsChange,
    providerAccountId,
    setProviderAccountId,
  } = useSessionSettings(designSessionId);
  const { options: modelOptions } = useAvailableAiModels(repoId, model);
  const { options: accounts, resolveId: resolveAccountId } =
    useProviderAccounts();

  const draftSeed = useChatDraftSeed({
    kind: "designChat" as const,
    designSessionId,
  });

  const messagesList = messages ?? [];
  const lastMessage = messagesList[messagesList.length - 1];

  // Previously sent messages as editable display text, newest-first, for
  // ArrowUp/ArrowDown history recall in the composer.
  const messageHistory = (messages ?? [])
    .filter((m) => m.role === "user" && !m.isSystemAlert && m.content)
    .map((m) => tokenizedToEditable(m.content ?? "").displayText)
    .reverse();

  useEffect(() => {
    if (isSending && lastMessage?.role === "assistant" && lastMessage.content) {
      setIsSending(false);
    }
  }, [isSending, lastMessage]);

  const personaMap = new Map(personas?.map((p) => [p._id, p]) ?? []);

  const evaIcon = <EvaIcon />;

  const isExecuting = isSending || parentIsExecuting;

  const handleSend = async (
    text: string,
    attachmentStorageIds: Id<"_storage">[],
  ) => {
    const visible = text.trim();
    // Allow sending an image with no text, but not a fully empty message.
    if ((!visible && attachmentStorageIds.length === 0) || !isSandboxActive) {
      return;
    }
    const message = mentionRef.current?.tokenize(visible) ?? visible;
    const ids =
      attachmentStorageIds.length > 0 ? attachmentStorageIds : undefined;
    if (isExecuting) {
      await enqueueMessage({
        id: designSessionId,
        message,
        model,
        ...executionTraits,
        providerAccountId: resolveAccountId(providerAccountId),
        personaId: selectedPersonaId,
        numDesigns,
        attachmentStorageIds: ids,
      });
      return;
    }
    setIsSending(true);
    try {
      await executeMessage({
        id: designSessionId,
        message,
        model,
        ...executionTraits,
        providerAccountId: resolveAccountId(providerAccountId),
        personaId: selectedPersonaId,
        numDesigns,
        attachmentStorageIds: ids,
      });
    } catch {
      setIsSending(false);
    }
  };

  const handleCancel = async () => {
    await cancelExecution({ id: designSessionId });
  };

  const handlePromptSubmit = async ({ text, files }: PromptInputMessage) => {
    if (!isSandboxActive) return;
    const imageCount = files.filter((file) =>
      file.mediaType?.startsWith("image/"),
    ).length;
    const attachmentStorageIds = await uploadImageAttachments(files);
    if (attachmentStorageIds.length < imageCount) {
      toast.error("Some images could not be uploaded.");
    }
    await handleSend(text, attachmentStorageIds);
  };

  const queuedMessageItems = (queuedMessages ?? []).map(
    (message: QueuedDesignMessage) => {
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
        model: message.model,
        reasoningLevel: message.reasoningLevel,
      };
    },
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
            className={`motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.96] ${isSandboxActive ? "" : "text-success"}`}
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
                className="size-8 motion-press hover:scale-[1.03] active:scale-[0.96]"
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
                    timestamp={message.timestamp}
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
                            ? "rounded-surface bg-secondary text-foreground px-4 py-3"
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
                                    finalText={message.content}
                                  />
                                )}
                                <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                                  {message.content}
                                </MessageResponse>
                              </>
                            ) : (
                              <>
                                <UserMessageAttachments
                                  attachments={
                                    message.attachments ??
                                    message.attachmentUrls?.map((url) => ({
                                      url,
                                      contentType: url ? "image/*" : null,
                                    }))
                                  }
                                />
                                {message.content ? (
                                  <MessageMentionText
                                    text={message.content}
                                    repoBasePath={basePath}
                                  />
                                ) : null}
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-2">
                                    {message.personaId ? (
                                      <span className="text-[11px] text-muted-foreground/60">
                                        {personaMap.get(message.personaId)
                                          ?.name ?? "Persona"}
                                      </span>
                                    ) : null}
                                    {message.credentialSourceLabel ? (
                                      <span className="text-[11px] text-muted-foreground/60">
                                        {message.credentialSourceLabel}
                                      </span>
                                    ) : null}
                                  </div>
                                  {message.timestamp ? (
                                    <span className="text-[11px] text-muted-foreground/60">
                                      {dayjs(message.timestamp).format(
                                        "h:mm A",
                                      )}
                                    </span>
                                  ) : null}
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
          <ConversationScrollButton resetKey={designSessionId} />
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
              onReorder={async (orderedIds) => {
                await reorderQueuedMessages({
                  parentId: designSessionId,
                  orderedIds,
                });
              }}
            />
            {!draftSeed.isReady ? (
              // Placeholder that matches the input group's visual footprint.
              // Keeps layout stable while the draft query resolves, preventing
              // the PromptInputProvider from mounting with an empty initialInput.
              <div
                aria-busy="true"
                aria-label="Loading draft..."
                className="pointer-events-none rounded-surface border border-border shadow-lg bg-background opacity-50 min-h-[4.5rem]"
              />
            ) : (
              <PromptInputProvider initialInput={draftSeed.initialDisplay}>
                <ChatDraftSync
                  target={{ kind: "designChat" as const, designSessionId }}
                  mentionRef={mentionRef}
                  initialDisplay={draftSeed.initialDisplay}
                />
                <PromptInput
                  onSubmit={handlePromptSubmit}
                  accept="image/*"
                  multiple
                  maxFiles={MAX_IMAGE_ATTACHMENTS}
                  maxFileSize={MAX_IMAGE_ATTACHMENT_BYTES}
                  onError={(err) =>
                    toast.error(imageAttachmentErrorMessage(err))
                  }
                >
                  <ChatAttachmentPreview />
                  <MentionTextarea
                    ref={mentionRef}
                    repoBasePath={basePath}
                    docs={docs}
                    placeholder={
                      !isSandboxActive
                        ? "Start the sandbox to begin designing..."
                        : isExecuting
                          ? "Add a follow-up..."
                          : "Ask Eva anything... / for skills · @ for docs"
                    }
                    initialMentionMap={draftSeed.mentionMap}
                    initialSkillMap={draftSeed.skillMap}
                    history={messageHistory}
                    enableImagePaste
                  />
                  <PromptInputFooter>
                    <PromptInputTools>
                      <ComposerPlusMenu
                        docs={docs}
                        skills={skills}
                        mentionRef={mentionRef}
                        attachmentMode="images"
                      />
                      <PersonaDropdown
                        repoId={repoId}
                        value={selectedPersonaId}
                        onChange={setSelectedPersonaId}
                      />
                    </PromptInputTools>
                    <div className="flex min-w-0 items-center gap-1">
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
                                : "hover:bg-muted"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <ModelSelect
                        value={model}
                        options={modelOptions}
                        onValueChange={setModel}
                        accounts={accounts}
                        accountId={providerAccountId}
                        onAccountChange={setProviderAccountId}
                      />
                      {modelHasTraits(model) ? (
                        <TraitsMenu
                          config={getModelTraits(model)}
                          effortLevel={displayTraits.effortLevel}
                          thinkingEnabled={displayTraits.thinkingEnabled}
                          use1mContext={displayTraits.use1mContext}
                          getLevelLabel={getReasoningLevelLabel}
                          onEffortLevelChange={(level) => {
                            if (level === undefined) {
                              onTraitsChange({ effortLevel: undefined });
                              return;
                            }
                            const { reasoning } = getModelTraits(model);
                            if (!reasoning) return;
                            const match = reasoning.levels.find(
                              (entry) => entry === level,
                            );
                            if (match) {
                              onTraitsChange({ effortLevel: match });
                            }
                          }}
                          onThinkingEnabledChange={(enabled) =>
                            onTraitsChange({
                              thinkingEnabled: enabled ? undefined : false,
                            })
                          }
                          onUse1mContextChange={(use1m) =>
                            onTraitsChange({
                              use1mContext: use1m ? true : undefined,
                            })
                          }
                        />
                      ) : null}
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
                          isSending && !parentIsExecuting
                            ? "submitted"
                            : undefined
                        }
                        disabled={!isSandboxActive}
                        title={isExecuting ? "Queue message" : "Send message"}
                      />
                    </div>
                  </PromptInputFooter>
                </PromptInput>
              </PromptInputProvider>
            )}
          </div>
        )}
      </ChatPageWrapper>
    </div>
  );
}
