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
  usePromptInputController,
  type PromptInputMessage,
  type ModelOption,
} from "@conductor/ui";
import {
  IconPlayerStop,
  IconCode,
  IconClipboardList,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api, type AIModel } from "@conductor/backend";
import type { Doc, Id } from "@conductor/backend";
import { ScreenshotPreview, VideoPreview } from "@/lib/components/MediaPreview";
import { MessageMentionText } from "@/lib/components/chat/MessageMentionText";
import {
  MentionTextarea,
  type MentionTextareaHandle,
} from "@/lib/components/chat/MentionTextarea";
import dayjs from "@conductor/shared/dates";
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
};

export type ChatBodyQueuedMessage = Doc<"queuedMessages">;

interface ParsedQuestion {
  question: string;
  header: string;
  options: Array<{ label: string; description: string }>;
  multiSelect: boolean;
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

function isOptionItem(
  val: unknown,
): val is { label: string; description: string } {
  return (
    isRecord(val) &&
    typeof val.label === "string" &&
    typeof val.description === "string"
  );
}

function isParsedQuestion(val: unknown): val is ParsedQuestion {
  return (
    isRecord(val) &&
    typeof val.question === "string" &&
    typeof val.header === "string" &&
    typeof val.multiSelect === "boolean" &&
    Array.isArray(val.options) &&
    val.options.every(isOptionItem)
  );
}

function parsePendingQuestion(
  raw: string | undefined | null,
): ParsedQuestion[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.questions)) return null;
    const questions = parsed.questions.filter(isParsedQuestion);
    return questions.length > 0 ? questions : null;
  } catch {
    return null;
  }
}

interface ChatBodyProps {
  repoId: Id<"githubRepos">;
  repoOwner: string;
  repoName: string;
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
  /** Called with the tokenized content. Caller decides whether to send or enqueue. */
  onSend: (content: string) => Promise<void>;
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
}

export function ChatBody({
  repoId,
  repoOwner,
  repoName,
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
  onSend,
  onCancel,
  preConversationContent,
  beforeQueuedContent,
  preInputContent,
  toolsBefore,
  emptyStateOverride,
  formatQueuedInfo,
}: ChatBodyProps) {
  const docs = useQuery(api.docs.list, { repoId }) ?? [];
  const skills = useQuery(api.repoSkills.listByRepo, { repoId }) ?? [];
  const mentionRef = useRef<MentionTextareaHandle>(null);
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

  const handleSubmit = useCallback(
    async (text: string) => {
      const visible = text.trim();
      if (!visible) return;
      const content = mentionRef.current?.tokenize(visible) ?? visible;
      await onSend(content);
    },
    [onSend],
  );

  const handlePromptSubmit = async ({ text }: PromptInputMessage) => {
    if (isInputDisabled) return;
    await handleSubmit(text);
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

  return (
    <>
      {preConversationContent}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="gap-3 p-3 max-w-3xl mx-auto w-full">
          {messages.length === 0
            ? (emptyStateOverride ?? (
                <ConversationEmptyState title={emptyStateTitle} />
              ))
            : messages.map((message) =>
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
                            ? "group rounded-xl bg-secondary text-foreground px-4 py-3"
                            : "px-1 py-2"
                        }
                      >
                        {message.role === "assistant" && !message.content ? (
                          <>
                            {streamingContent ? (
                              <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
                                {streamingContent}
                              </MessageResponse>
                            ) : null}
                            <StreamingActivityDisplay
                              activity={streamingActivity}
                              name="Eva"
                              icon={evaIcon}
                              startedAt={message.timestamp}
                            />
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
                              <MessageMentionText
                                text={message.content}
                                owner={repoOwner}
                                repo={repoName}
                              />
                            )}
                          </>
                        )}
                      </MessageContent>
                      {message.role === "user" && (
                        <div className="flex items-center justify-end gap-2 mt-0.5 ml-auto">
                          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {message.mode && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                                {message.mode === "plan" ? (
                                  <>
                                    <IconClipboardList className="w-2.5 h-2.5" />{" "}
                                    PRD
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
                ),
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
                text={content}
                owner={repoOwner}
                repo={repoName}
                className="truncate text-xs"
              />
            )}
            onEdit={async (id, content) => {
              await updateQueuedMessage({ id, content });
            }}
            onDelete={async (id) => {
              await deleteQueuedMessage({ id });
            }}
          />
          {preInputContent}
          {!hintDismissed ? (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              <span className="min-w-0 flex-1">
                <span className="font-medium text-foreground/80">@</span> to
                mention a doc or PRD ·{" "}
                <span className="font-medium text-foreground/80">/</span> for
                skills
              </span>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 hover:bg-accent hover:text-foreground"
                aria-label="Dismiss tip"
                onClick={() => setHintDismissed(true)}
              >
                <IconX className="size-3" />
              </button>
            </div>
          ) : null}
          <div>
            <PromptInputProvider>
              <PromptInput onSubmit={handlePromptSubmit}>
                <MentionTextarea
                  ref={mentionRef}
                  docs={docs}
                  skills={skills}
                  skillsSettingsHref={`/${repoOwner}/${repoName}/settings/skills`}
                  placeholder={placeholder}
                />
                <PromptInputFooter>
                  <PromptInputTools>{toolsBefore}</PromptInputTools>
                  <div className="flex min-w-0 items-center gap-1">
                    <ModelSelect
                      value={model}
                      options={modelOptions}
                      onValueChange={setModel}
                      className="max-w-48 truncate sm:max-w-none"
                    />
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
  const { textInput } = usePromptInputController();
  const isEmpty = textInput.value.trim().length === 0;

  return (
    <PromptInputSubmit
      disabled={disabled || isEmpty}
      title={isExecuting ? "Queue message" : "Send message"}
    />
  );
}
