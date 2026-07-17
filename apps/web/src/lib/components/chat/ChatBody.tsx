import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  type ModelOption,
  type ModelAccount,
} from "@conductor/ui";
import { ChatLastTurn } from "@/lib/components/chat/ChatLastTurn";
import { ChatJumpRail } from "@/lib/components/chat/ChatJumpRail";
import { ChatComposer } from "@/lib/components/chat/ChatComposer";
import { ChatMessage } from "@/lib/components/chat/ChatMessage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type AIModel, type ReasoningLevel, type Id } from "@conductor/backend";
import type { ChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import {
  buildJumpRailTicks,
  buildMessageHistory,
  findLastUserMessageIndex,
  parsePendingQuestion,
  type ChatBodyMessage,
  type ChatBodyQueuedMessage,
} from "@/lib/components/chat/chatBodyUtils";

export type { ChatBodyMessage, ChatBodyQueuedMessage };

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
  /**
   * A blocking AskUserQuestion awaiting the user (Agent SDK `canUseTool`). When
   * set, its interactive card replaces the fire-and-forget `streamingPendingQuestion`
   * path and the turn stays executing until {@link onAnswerBlockingQuestion} runs.
   */
  blockingQuestion?: { toolUseId: string; payload: string };
  /** Submits a structured answer for {@link blockingQuestion}, resuming the turn. */
  onAnswerBlockingQuestion?: (
    toolUseId: string,
    answers: Record<string, string>,
  ) => Promise<void>;
  isExecuting: boolean;
  isInputDisabled: boolean;
  isArchived?: boolean;
  placeholder: string;
  emptyStateTitle: string;
  model: AIModel;
  setModel: (model: AIModel) => void;
  modelOptions: ReadonlyArray<ModelOption<AIModel>>;
  /**
   * The user's own provider accounts. When non-empty, the model picker nests
   * Team + account submenus under each provider; the chosen account's
   * credentials run the turn (see `accountId`/`onAccountChange`).
   */
  accounts?: ReadonlyArray<ModelAccount>;
  accountId?: string | null;
  onAccountChange?: (accountId: string | null) => void;
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
  /** Opens the Diffs tab; optional repo-relative path scrolls to that file. */
  onViewDiff?: (repoRelativePath?: string) => void;
  /** True when ephemeral diff review comments are queued for the next send. */
  hasPendingContext?: boolean;
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
  blockingQuestion,
  onAnswerBlockingQuestion,
  isExecuting,
  isInputDisabled,
  isArchived,
  placeholder,
  emptyStateTitle,
  model,
  setModel,
  modelOptions,
  accounts,
  accountId,
  onAccountChange,
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
  onViewDiff,
  hasPendingContext,
}: ChatBodyProps) {
  const lastMessage = messages[messages.length - 1];
  const lastMessageId = lastMessage?._id;

  const [questionDismissed, setQuestionDismissed] = useState(false);
  const pendingQuestionRaw =
    streamingPendingQuestion ?? lastMessage?.pendingQuestion;
  const activePendingQuestion = useMemo(
    () => (questionDismissed ? null : parsePendingQuestion(pendingQuestionRaw)),
    [questionDismissed, pendingQuestionRaw],
  );
  // A blocking AskUserQuestion (Agent SDK) takes precedence over the
  // fire-and-forget path: it keeps the turn paused until the user answers.
  const blockingQuestions = useMemo(
    () =>
      blockingQuestion ? parsePendingQuestion(blockingQuestion.payload) : null,
    [blockingQuestion],
  );

  useEffect(() => {
    if (pendingQuestionRaw) {
      setQuestionDismissed(false);
    }
  }, [pendingQuestionRaw]);

  const handleQuestionAnswer = useCallback(
    async (answer: string) => {
      setQuestionDismissed(true);
      await onSend(answer);
    },
    [onSend],
  );

  const handleBlockingAnswer = useCallback(
    async (answers: Record<string, string>) => {
      if (!blockingQuestion || !onAnswerBlockingQuestion) return;
      await onAnswerBlockingQuestion(blockingQuestion.toolUseId, answers);
    },
    [blockingQuestion, onAnswerBlockingQuestion],
  );

  const messageHistory = useMemo(
    () => buildMessageHistory(messages),
    [messages],
  );

  const lastUserMessageIndex = useMemo(
    () => findLastUserMessageIndex(messages),
    [messages],
  );

  const jumpRailMessages = useMemo(
    () => buildJumpRailTicks(messages),
    [messages],
  );

  const renderMessage = (message: ChatBodyMessage) => {
    const isLast = message._id === lastMessageId;
    const isStreamingPlaceholder =
      message.role === "assistant" &&
      !message.content &&
      message.finishedAt === undefined;

    return (
      <ChatMessage
        key={message._id}
        message={message}
        repoBasePath={repoBasePath}
        isLast={isLast}
        streamingActivity={
          isStreamingPlaceholder ? streamingActivity : undefined
        }
        streamingContent={isLast ? streamingContent : undefined}
        blockingQuestions={
          isStreamingPlaceholder ? blockingQuestions : undefined
        }
        activePendingQuestion={
          isStreamingPlaceholder || isLast ? activePendingQuestion : undefined
        }
        isExecuting={isExecuting}
        onQuestionAnswer={handleQuestionAnswer}
        onBlockingAnswer={handleBlockingAnswer}
        onOpenFile={onOpenFile}
        onViewDiff={onViewDiff}
      />
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
        <ChatJumpRail messages={jumpRailMessages} />
      </Conversation>
      {!isArchived && !activePendingQuestion && !blockingQuestions && (
        <ChatComposer
          repoId={repoId}
          repoBasePath={repoBasePath}
          conversationId={conversationId}
          queuedMessages={queuedMessages}
          messageHistory={messageHistory}
          isExecuting={isExecuting}
          isInputDisabled={isInputDisabled}
          placeholder={placeholder}
          model={model}
          setModel={setModel}
          modelOptions={modelOptions}
          accounts={accounts}
          accountId={accountId}
          onAccountChange={onAccountChange}
          reasoningLevel={reasoningLevel}
          onReasoningLevelChange={onReasoningLevelChange}
          onSend={onSend}
          onCancel={onCancel}
          beforeQueuedContent={beforeQueuedContent}
          preInputContent={preInputContent}
          toolsBefore={toolsBefore}
          formatQueuedInfo={formatQueuedInfo}
          draft={draft}
          isDraftLoading={isDraftLoading}
          hasPendingContext={hasPendingContext}
        />
      )}
    </>
  );
}
