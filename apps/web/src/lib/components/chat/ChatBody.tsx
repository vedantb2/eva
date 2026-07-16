import {
  Button,
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
  PromptInputSpeech,
  PromptInputSubmit,
  ModelSelect,
  ReasoningLever,
  usePromptInputController,
  usePromptInputAttachments,
  toast,
  type PromptInputMessage,
  type ModelOption,
} from "@conductor/ui";
import { parseStorageId } from "@/lib/components/artifacts/_meta";
import { ChatDraftSync } from "@/lib/components/chat/ChatDraftSync";
import type { ChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import { ChatLastTurn } from "@/lib/components/chat/ChatLastTurn";
import { ChatTypeToFocus } from "@/lib/components/chat/ChatTypeToFocus";
import { ChatTypingLayer } from "@/lib/components/chat/ChatTypingLayer";
import {
  IconPlayerStop,
  IconCode,
  IconClipboardList,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { z } from "zod";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import {
  api,
  getAIModelProvider,
  providerSupportsReasoning,
  REASONING_LEVELS,
  type AIModel,
  type ReasoningLevel,
  type Doc,
  type Id,
} from "@conductor/backend";
import { ScreenshotPreview, VideoPreview } from "@/lib/components/MediaPreview";
import { MessageMentionText } from "@/lib/components/chat/MessageMentionText";
import { tokenizedToEditable } from "@/lib/components/mentions";
import { ChatMessageActions } from "@/lib/components/chat/ChatMessageActions";
import {
  MentionTextarea,
  type MentionTextareaHandle,
} from "@/lib/components/chat/MentionTextarea";
import dayjs from "@conductor/shared/dates";
import { formatDuration } from "@conductor/shared/duration";
import { EvaIcon } from "@/lib/components/EvaIcon";
import { UserMessageAvatar } from "@/lib/components/UserMessageAvatar";
import { QueuedMessagesPanel } from "@/lib/components/QueuedMessagesPanel";
import {
  StreamingActivityDisplay,
  ActivityLogDisplay,
} from "@/lib/components/StreamingActivityDisplay";
import { SystemAlertMessage } from "@/lib/components/SystemAlertMessage";
import { MultipleChoiceQuestion } from "@/lib/components/plan/MultipleChoiceQuestion";

export type ChatBodyMessage = Doc<"messages"> & {
  imageUrl?: string | null;
  videoUrl?: string | null;
  attachmentUrls?: (string | null)[];
};

export type ChatBodyQueuedMessage = Doc<"queuedMessages">;

const REASONING_LEVEL_LABELS: Record<ReasoningLevel, string> = {
  off: "Off",
  low: "Low",
  medium: "Medium",
  high: "High",
  max: "Max",
};
const REASONING_LEVEL_OPTIONS = REASONING_LEVELS.map((value) => ({
  value,
  label: REASONING_LEVEL_LABELS[value],
}));

const MAX_IMAGE_ATTACHMENTS = 5;
const MAX_IMAGE_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

function imageAttachmentErrorMessage(err: {
  code: "max_files" | "max_file_size" | "accept";
}): string {
  switch (err.code) {
    case "max_files":
      return `You can attach up to ${MAX_IMAGE_ATTACHMENTS} images.`;
    case "max_file_size":
      return "Images must be 10 MB or smaller.";
    case "accept":
      return "Only image files can be attached.";
  }
}

// Boundary schema for the pending-question JSON emitted by the agent. A
// question with any malformed field (or option) is dropped via
// `.catch(null)` + filter, matching the previous per-item guard behaviour.
const questionSchema = z.object({
  question: z.string(),
  header: z.string(),
  multiSelect: z.boolean(),
  options: z.array(z.object({ label: z.string(), description: z.string() })),
});

type ParsedQuestion = z.infer<typeof questionSchema>;

const pendingQuestionSchema = z.object({
  questions: z.array(questionSchema.nullable().catch(null)),
});

function parsePendingQuestion(
  raw: string | undefined | null,
): ParsedQuestion[] | null {
  if (!raw) return null;
  try {
    const parsed = pendingQuestionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const questions = parsed.data.questions.flatMap((q) => (q ? [q] : []));
    return questions.length > 0 ? questions : null;
  } catch {
    return null;
  }
}

interface ChatBodyProps {
  repoId: Id<"githubRepos">;
  /** Repo route prefix, e.g. `/owner/repo` or `/owner/repo--app`. */
  repoBasePath: string;
  /** Conversation id (session / agent task / project) — scopes the typing-presence room. */
  conversationId: string;
  messages: ChatBodyMessage[];
  queuedMessages: ChatBodyQueuedMessage[];
  streamingActivity?: string;
  streamingContent?: string;
  streamingPendingQuestion?: string;
  isExecuting: boolean;
  isInputDisabled: boolean;
  isArchived?: boolean;
  placeholder: string;
  emptyStateTitle: string;
  model: AIModel;
  setModel: (model: AIModel) => void;
  modelOptions: ReadonlyArray<ModelOption<AIModel>>;
  /**
   * Session-wide reasoning effort. When both the level and setter are provided
   * and the selected model's provider supports a runtime lever (Claude/Codex),
   * a reasoning lever is shown after the model selector in the input tools row.
   */
  reasoningLevel?: ReasoningLevel;
  onReasoningLevelChange?: (level: ReasoningLevel) => void;
  /**
   * Called with the tokenized content and any uploaded image attachment storage
   * ids. Caller decides whether to send or enqueue.
   */
  onSend: (
    content: string,
    attachmentStorageIds?: Id<"_storage">[],
  ) => Promise<void>;
  onCancel: () => Promise<void>;
  /** Optional slot inserted above the conversation (session summary accordion). */
  preConversationContent?: React.ReactNode;
  /** Optional slot inserted above the queued messages panel (session startup streaming). */
  beforeQueuedContent?: React.ReactNode;
  /** Optional slot inserted between the queued messages panel and the input (session PRD plan view). */
  preInputContent?: React.ReactNode;
  /** Optional slot inserted before the model selector (session mode dropdown). */
  toolsBefore?: React.ReactNode;
  /** Replaces the default empty-state component when there are zero messages. */
  emptyStateOverride?: React.ReactNode;
  /** Optional formatter for queued message info tooltips. Falls back to none. */
  formatQueuedInfo?: (msg: ChatBodyQueuedMessage) => string | undefined;
  /**
   * Draft seed to restore. When provided, the PromptInputProvider is seeded
   * with the stored draft text and mention maps, and a ChatDraftSync child
   * saves keystrokes back to Convex.
   *
   * IMPORTANT: only pass this once the draft query has resolved — the provider
   * reads initialInput only at mount, so it must not mount before the data is
   * available. Use `isDraftLoading` to render a placeholder while waiting.
   */
  draft?: ChatDraftSeed;
  /**
   * When true, renders a disabled placeholder in place of the real input while
   * the draft query is in flight. This prevents the PromptInputProvider from
   * mounting with an empty initial value before the persisted draft is known.
   */
  isDraftLoading?: boolean;
  /**
   * When provided, file chips in assistant activity blocks become clickable and
   * call this with the file's full path (sessions wire this to the File Viewer
   * tab). Pass a stable callback — the activity renderer is memoised.
   */
  onOpenFile?: (path: string) => void;
}

export function ChatBody({
  repoId,
  repoBasePath,
  conversationId,
  messages,
  queuedMessages,
  streamingActivity,
  streamingContent,
  streamingPendingQuestion,
  isExecuting,
  isInputDisabled,
  isArchived,
  placeholder,
  emptyStateTitle,
  model,
  setModel,
  modelOptions,
  reasoningLevel,
  onReasoningLevelChange,
  onSend,
  onCancel,
  preConversationContent,
  beforeQueuedContent,
  preInputContent,
  toolsBefore,
  emptyStateOverride,
  formatQueuedInfo,
  draft,
  isDraftLoading,
  onOpenFile,
}: ChatBodyProps) {
  const docs = useQuery(api.docs.list, { repoId }) ?? [];
  const skills = useQuery(api.repoSkills.listByRepo, { repoId }) ?? [];
  const currentUserId = useQuery(api.auth.me);
  const mentionRef = useRef<MentionTextareaHandle>(null);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const updateQueuedMessage = useMutation(
    api.queuedMessages.update,
  ).withOptimisticUpdate((localStore, args) => {
    const msg = queuedMessages.find((m) => m._id === args.id);
    if (!msg) return;
    const current = localStore.getQuery(api.queuedMessages.listByParent, {
      parentId: msg.parentId,
    });
    if (current !== undefined) {
      localStore.setQuery(
        api.queuedMessages.listByParent,
        { parentId: msg.parentId },
        current.map((m) =>
          m._id === args.id ? { ...m, content: args.content } : m,
        ),
      );
    }
  });
  const deleteQueuedMessage = useMutation(
    api.queuedMessages.remove,
  ).withOptimisticUpdate((localStore, args) => {
    const msg = queuedMessages.find((m) => m._id === args.id);
    if (!msg) return;
    const current = localStore.getQuery(api.queuedMessages.listByParent, {
      parentId: msg.parentId,
    });
    if (current !== undefined) {
      localStore.setQuery(
        api.queuedMessages.listByParent,
        { parentId: msg.parentId },
        current.filter((m) => m._id !== args.id),
      );
    }
  });
  const reorderQueuedMessages = useMutation(
    api.queuedMessages.reorder,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.queuedMessages.listByParent, {
      parentId: args.parentId,
    });
    if (current === undefined) return;
    const byId = new Map(current.map((m) => [m._id, m]));
    const reordered = args.orderedIds
      .map((id) => byId.get(id))
      .filter((m): m is (typeof current)[number] => m !== undefined);
    localStore.setQuery(
      api.queuedMessages.listByParent,
      { parentId: args.parentId },
      reordered,
    );
  });

  const evaIcon = <EvaIcon />;

  const lastMessage = messages[messages.length - 1];

  const [hintDismissed, setHintDismissed] = useState(false);
  const [questionDismissed, setQuestionDismissed] = useState(false);
  const pendingQuestionRaw =
    streamingPendingQuestion ?? lastMessage?.pendingQuestion;
  const activePendingQuestion = useMemo(
    () => (questionDismissed ? null : parsePendingQuestion(pendingQuestionRaw)),
    [questionDismissed, pendingQuestionRaw],
  );

  useEffect(() => {
    if (pendingQuestionRaw) {
      setQuestionDismissed(false);
    }
  }, [pendingQuestionRaw]);

  // Uploads pasted/dropped composer images to Convex storage (the prompt-input
  // layer has already converted their blob URLs to data URLs) and returns the
  // resulting storage ids. Non-image files and failed uploads are dropped.
  const uploadImageAttachments = useCallback(
    async (files: PromptInputMessage["files"]): Promise<Id<"_storage">[]> => {
      const images = files.filter((file) =>
        file.mediaType?.startsWith("image/"),
      );
      const results = await Promise.all(
        images.map(async (file) => {
          try {
            const blob = await (await fetch(file.url)).blob();
            const uploadUrl = await generateUploadUrl({});
            const res = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": file.mediaType ?? blob.type },
              body: blob,
            });
            if (!res.ok) return null;
            return parseStorageId(await res.text());
          } catch {
            return null;
          }
        }),
      );
      return results.filter((id): id is Id<"_storage"> => id !== null);
    },
    [generateUploadUrl],
  );

  const handleSubmit = useCallback(
    async (text: string, files: PromptInputMessage["files"]) => {
      const visible = text.trim();
      const imageCount = files.filter((file) =>
        file.mediaType?.startsWith("image/"),
      ).length;
      const attachmentStorageIds = await uploadImageAttachments(files);
      if (attachmentStorageIds.length < imageCount) {
        toast.error("Some images could not be uploaded.");
      }
      // Allow sending with images and no text, but not an empty message.
      if (!visible && attachmentStorageIds.length === 0) return;
      const content = mentionRef.current?.tokenize(visible) ?? visible;
      await onSend(
        content,
        attachmentStorageIds.length > 0 ? attachmentStorageIds : undefined,
      );
    },
    [onSend, uploadImageAttachments],
  );

  const handlePromptSubmit = async ({ text, files }: PromptInputMessage) => {
    if (isInputDisabled) return;
    await handleSubmit(text, files);
  };

  const handleQuestionAnswer = useCallback(
    async (answer: string) => {
      setQuestionDismissed(true);
      await onSend(answer);
    },
    [onSend],
  );

  const queuedMessageItems = useMemo(
    () =>
      queuedMessages.map((message) => ({
        id: message._id,
        content: message.content,
        info: formatQueuedInfo?.(message),
      })),
    [queuedMessages, formatQueuedInfo],
  );

  // Previously sent user messages as editable display text, newest-first, for
  // ArrowUp/ArrowDown history recall in the composer. Tokenized mentions are
  // de-tokenized to plain label text (the editor's chip map is mount-only).
  const messageHistory = useMemo(
    () =>
      messages
        .filter((m) => m.role === "user" && !m.isSystemAlert && m.content)
        .map((m) => tokenizedToEditable(m.content ?? "").displayText)
        .reverse(),
    [messages],
  );

  // Index of the latest user message — everything from here to the end is the
  // "last turn" that gets viewport min-height so stick-to-bottom pins it to the top.
  const lastUserMessageIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message && message.role === "user" && !message.isSystemAlert) {
        return i;
      }
    }
    return -1;
  }, [messages]);

  const renderMessage = (message: ChatBodyMessage) => {
    if (message.isSystemAlert) {
      return (
        <SystemAlertMessage
          key={message._id}
          content={message.content ?? ""}
          errorDetail={message.errorDetail}
          timestamp={message.timestamp}
        />
      );
    }

    return (
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
                ? "group rounded-surface bg-secondary text-foreground px-4 py-3"
                : "px-1 py-2"
            }
          >
            {message.role === "assistant" && !message.content ? (
              <>
                <StreamingActivityDisplay
                  activity={streamingActivity}
                  name="Eva"
                  startedAt={message.timestamp}
                  onOpenFile={onOpenFile}
                />
                {message._id === lastMessage?._id && streamingContent ? (
                  <MessageResponse className="prose prose-sm dark:prose-invert max-w-none mt-2">
                    {streamingContent}
                  </MessageResponse>
                ) : null}
                {activePendingQuestion && (
                  <div className="mt-3">
                    <MultipleChoiceQuestion
                      questions={activePendingQuestion}
                      onAnswer={handleQuestionAnswer}
                      isLoading={isExecuting}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                {message.role === "assistant" ? (
                  <>
                    {message.activityLog && (
                      <ActivityLogDisplay
                        activityLog={message.activityLog}
                        name="Eva"
                        icon={evaIcon}
                        startedAt={message.timestamp}
                        finishedAt={message.finishedAt}
                        finalText={message.content}
                        onOpenFile={onOpenFile}
                      />
                    )}
                    <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                      {message.content}
                    </MessageResponse>
                    {message.imageUrl && (
                      <ScreenshotPreview url={message.imageUrl} />
                    )}
                    {message.videoUrl && (
                      <VideoPreview url={message.videoUrl} />
                    )}
                    {message._id === lastMessage?._id &&
                      activePendingQuestion && (
                        <div className="mt-3">
                          <MultipleChoiceQuestion
                            questions={activePendingQuestion}
                            onAnswer={handleQuestionAnswer}
                          />
                        </div>
                      )}
                  </>
                ) : (
                  <>
                    <UserAttachmentImages urls={message.attachmentUrls} />
                    {message.content ? (
                      <MessageMentionText
                        text={message.content}
                        repoBasePath={repoBasePath}
                      />
                    ) : null}
                  </>
                )}
              </>
            )}
          </MessageContent>
          {message.role === "assistant" && message.content ? (
            <div className="flex items-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
              <ChatMessageActions
                copyText={message.content}
                className="ml-0.5"
                revealOnHover={false}
              />
              {message.finishedAt && message.timestamp ? (
                <span className="text-[11px] tabular-nums text-muted-foreground/60">
                  {dayjs(message.timestamp).format("h:mm A")} ·{" "}
                  {formatDuration(message.timestamp, message.finishedAt)}
                </span>
              ) : null}
            </div>
          ) : null}
          {message.role === "user" && (
            <div className="flex items-center justify-end gap-2 mt-0.5 ml-auto">
              <div className="flex items-center gap-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                {message.content ? (
                  <ChatMessageActions
                    copyText={message.content}
                    revealOnHover={false}
                  />
                ) : null}
                {message.mode && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                    {message.mode === "plan" ? (
                      <>
                        <IconClipboardList className="w-2.5 h-2.5" /> PRD
                      </>
                    ) : (
                      <>
                        <IconCode className="w-2.5 h-2.5" /> Edit
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
              <UserMessageAvatar userId={message.userId} />
            </div>
          )}
        </AIMessage>
      </motion.div>
    );
  };

  return (
    <>
      {preConversationContent}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="gap-3 p-3 max-w-3xl mx-auto w-full">
          {messages.length === 0 ? (
            (emptyStateOverride ?? (
              <ConversationEmptyState title={emptyStateTitle} />
            ))
          ) : lastUserMessageIndex < 0 ? (
            messages.map(renderMessage)
          ) : (
            <>
              {messages.slice(0, lastUserMessageIndex).map(renderMessage)}
              <ChatLastTurn>
                {messages.slice(lastUserMessageIndex).map(renderMessage)}
              </ChatLastTurn>
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      {!isArchived && !activePendingQuestion && (
        <div className="p-2 md:p-3 max-w-3xl mx-auto w-full">
          <AnimatePresence initial={false}>
            {beforeQueuedContent ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {beforeQueuedContent}
              </motion.div>
            ) : null}
          </AnimatePresence>
          <QueuedMessagesPanel
            items={queuedMessageItems}
            renderContent={(content) => (
              <MessageMentionText
                as="span"
                text={content}
                repoBasePath={repoBasePath}
                className="text-xs"
              />
            )}
            onEdit={async (id, content) => {
              await updateQueuedMessage({ id, content });
            }}
            onDelete={async (id) => {
              await deleteQueuedMessage({ id });
            }}
            onReorder={async (orderedIds) => {
              const parentId = queuedMessages[0]?.parentId;
              if (!parentId) return;
              await reorderQueuedMessages({ parentId, orderedIds });
            }}
          />
          {preInputContent}
          {!hintDismissed ? (
            <div className="mb-2 flex items-center gap-2 rounded-surface border border-border bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              <span className="min-w-0 flex-1">
                <span className="font-medium text-foreground/80">@</span> to
                mention a doc or PRD ·{" "}
                <span className="font-medium text-foreground/80">/</span> for
                skills
              </span>
              <button
                type="button"
                className="hit-target motion-press shrink-0 rounded p-0.5 active:scale-[0.96] hover:bg-muted hover:text-foreground"
                aria-label="Dismiss tip"
                onClick={() => setHintDismissed(true)}
              >
                <IconX className="size-3" />
              </button>
            </div>
          ) : null}
          <div className="relative">
            {isDraftLoading ? (
              // Placeholder that matches the input group's visual footprint.
              // Keeps the layout stable while the draft query resolves, and
              // prevents the PromptInputProvider from mounting with an empty
              // initialInput before the persisted draft is known.
              <div
                aria-busy="true"
                aria-label="Loading draft..."
                className="pointer-events-none rounded-surface border border-border shadow-lg bg-background opacity-50 min-h-[4.5rem]"
              />
            ) : (
              <PromptInputProvider initialInput={draft?.initialDisplay}>
                <ChatTypingLayer
                  roomId={`typing:chat:${conversationId}`}
                  userId={currentUserId}
                />
                <ChatTypeToFocus
                  mentionRef={mentionRef}
                  disabled={isInputDisabled}
                />
                {draft && (
                  <ChatDraftSync
                    target={draft.target}
                    mentionRef={mentionRef}
                    initialDisplay={draft.initialDisplay}
                  />
                )}
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
                    repoBasePath={repoBasePath}
                    docs={docs}
                    skills={skills}
                    skillsSettingsHref={`${repoBasePath}/settings/skills`}
                    placeholder={placeholder}
                    initialMentionMap={draft?.mentionMap}
                    initialSkillMap={draft?.skillMap}
                    history={messageHistory}
                    enableImagePaste
                  />
                  <PromptInputFooter>
                    <PromptInputTools>
                      {toolsBefore}
                      <ModelSelect
                        value={model}
                        options={modelOptions}
                        onValueChange={setModel}
                        className="max-w-48 truncate sm:max-w-none"
                      />
                      {onReasoningLevelChange &&
                      reasoningLevel &&
                      providerSupportsReasoning(getAIModelProvider(model)) ? (
                        <ReasoningLever
                          value={reasoningLevel}
                          options={REASONING_LEVEL_OPTIONS}
                          onValueChange={onReasoningLevelChange}
                        />
                      ) : null}
                    </PromptInputTools>
                    <div className="flex min-w-0 items-center gap-1">
                      <PromptInputSpeech />
                      {isExecuting ? (
                        <Button
                          size="icon-sm"
                          type="button"
                          variant="destructive"
                          onClick={onCancel}
                          title="Stop Eva"
                        >
                          <IconPlayerStop className="size-4" />
                        </Button>
                      ) : null}
                      <ChatBodySubmit
                        disabled={isInputDisabled}
                        isExecuting={isExecuting}
                      />
                    </div>
                  </PromptInputFooter>
                </PromptInput>
              </PromptInputProvider>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ChatBodySubmit({
  disabled,
  isExecuting,
}: {
  disabled: boolean;
  isExecuting: boolean;
}) {
  const { textInput, attachments } = usePromptInputController();
  // Sendable when there is text or at least one attached image.
  const isEmpty =
    textInput.value.trim().length === 0 && attachments.files.length === 0;

  return (
    <PromptInputSubmit
      disabled={disabled || isEmpty}
      title={isExecuting ? "Queue message" : "Send message"}
    />
  );
}

/** Renders a user message's attached input images as thumbnails that open full size. */
function UserAttachmentImages({ urls }: { urls?: (string | null)[] }) {
  const resolved = (urls ?? []).filter((url): url is string => Boolean(url));
  if (resolved.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {resolved.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block size-24 overflow-hidden rounded-surface border border-border bg-muted"
        >
          <img
            src={url}
            alt="Attached image"
            className="size-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}

/**
 * A row of thumbnails for the images currently attached in the composer, shown
 * above the input. Each has a remove button. Renders nothing when empty. Must be
 * rendered inside <PromptInput> so it reads the validated attachment context.
 */
function ChatAttachmentPreview() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 border-b border-border p-2">
      {attachments.files.map((file) => (
        <div
          key={file.id}
          className="group relative size-16 overflow-hidden rounded-surface border border-border bg-muted"
        >
          <img
            src={file.url}
            alt={file.filename ?? "Attached image"}
            className="size-full object-cover"
          />
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => attachments.remove(file.id)}
            className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-background"
          >
            <IconX className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
