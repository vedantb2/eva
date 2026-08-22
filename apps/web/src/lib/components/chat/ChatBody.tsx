import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  type ModelOption,
  type ModelAccount,
} from "@eva/ui";
import { ChatLastTurn } from "@/lib/components/chat/ChatLastTurn";
import { ChatJumpRail } from "@/lib/components/chat/ChatJumpRail";
import { ChatComposer } from "@/lib/components/chat/ChatComposer";
import { ChatMessage } from "@/lib/components/chat/ChatMessage";
import { ChatQuestionDock } from "@/lib/components/chat/ChatQuestionDock";
import { useChangedFilesExpansion } from "@/lib/components/chat/useChangedFilesExpansion";
import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import {
  api,
  type AIModel,
  type Id,
  type StoredModelTraits,
  type resolveTraitsForDisplay,
} from "@eva/backend";
import { useSimpleView } from "@/lib/hooks/useSimpleView";
import type { ChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import {
  buildJumpRailTicks,
  buildMessageHistory,
  findLastUserMessageIndex,
  findLastAssistantMessageId,
  findStreamingTargetMessage,
  findPrecedingUserTurn,
  firstNameFromUser,
  isOtherUserChatMessage,
  parsePendingQuestion,
  visibleChatMessages,
  type ChatBodyMessage,
  type ChatBodyQueuedMessage,
} from "@/lib/components/chat/chatBodyUtils";

export type { ChatBodyMessage };

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
   * Model trait controls (reasoning effort, thinking toggle, Fast, 1M context). When
   * provided, trait pills appear above the model list for capable models.
   */
  displayTraits?: ReturnType<typeof resolveTraitsForDisplay>;
  onTraitsChange?: (partial: Partial<StoredModelTraits>) => void;
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
  /** Replaces the default empty-state component when there are zero messages. */
  emptyStateOverride?: React.ReactNode;
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
  displayTraits,
  onTraitsChange,
  onSend,
  onCancel,
  preConversationContent,
  beforeQueuedContent,
  preInputContent,
  emptyStateOverride,
  draft,
  isDraftLoading,
  onOpenFile,
  onViewDiff,
  hasPendingContext,
}: ChatBodyProps) {
  // Simple view hides diffs and sandbox lifecycle banners. Quick task /
  // project / session all render through ChatBody, so this is the one gate.
  const simpleView = useSimpleView();
  const displayMessages = visibleChatMessages(messages, simpleView);

  const lastMessage = displayMessages[displayMessages.length - 1];
  // The oldest unfinished Working bubble owns the session-scoped streaming
  // row — turns run FIFO, so a newer queued placeholder must not steal a
  // still-streaming older turn's tokens (see findStreamingTargetMessage).
  const streamingTarget = findStreamingTargetMessage(displayMessages);
  const streamingTargetId = streamingTarget?._id;
  const latestAssistantMessageId = findLastAssistantMessageId(displayMessages);
  const { expandedByMessageId, setMessageExpanded } =
    useChangedFilesExpansion(conversationId);

  const [dismissedQuestionKey, setDismissedQuestionKey] = useState<
    string | null
  >(null);
  // Submit-in-flight only — not turn execution. Blocking AskUserQuestion leaves
  // the turn executing while waiting for the user; mirroring that would lock the UI.
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const pendingQuestionRaw =
    streamingPendingQuestion ??
    streamingTarget?.pendingQuestion ??
    lastMessage?.pendingQuestion;
  const questionDismissed =
    pendingQuestionRaw !== undefined &&
    pendingQuestionRaw !== null &&
    pendingQuestionRaw !== "" &&
    dismissedQuestionKey === pendingQuestionRaw;
  const activePendingQuestion = questionDismissed
    ? null
    : parsePendingQuestion(pendingQuestionRaw);
  // A blocking AskUserQuestion (Agent SDK) takes precedence over the
  // fire-and-forget path: it keeps the turn paused until the user answers.
  const blockingQuestions = blockingQuestion
    ? parsePendingQuestion(blockingQuestion.payload)
    : null;
  // Both question kinds render in the composer's slot, so the card stays put
  // instead of scrolling with the conversation. Blocking wins: it holds the
  // turn open and its answer resumes the run.
  const dockedQuestions = blockingQuestions ?? activePendingQuestion;

  const handleQuestionAnswer = async (answer: string) => {
    if (pendingQuestionRaw) {
      setDismissedQuestionKey(pendingQuestionRaw);
    }
    setIsAnsweringQuestion(true);
    // Reset is duplicated into the catch instead of using `finally`: React
    // Compiler bails on the whole file when it meets a `finally` clause.
    try {
      await onSend(answer);
    } catch (error) {
      setIsAnsweringQuestion(false);
      throw error;
    }
    setIsAnsweringQuestion(false);
  };

  const handleBlockingAnswer = async (answers: Record<string, string>) => {
    if (!blockingQuestion || !onAnswerBlockingQuestion) return;
    setIsAnsweringQuestion(true);
    try {
      await onAnswerBlockingQuestion(blockingQuestion.toolUseId, answers);
    } catch (error) {
      setIsAnsweringQuestion(false);
      throw error;
    }
    setIsAnsweringQuestion(false);
  };

  const messageHistory = buildMessageHistory(displayMessages);

  const lastUserMessageIndex = findLastUserMessageIndex(displayMessages);

  const jumpRailMessages = buildJumpRailTicks(displayMessages);

  const currentUserId = useQuery(api.auth.me);
  const users = useQuery(api.users.listAll);
  const firstNameByUserId = (() => {
    const map = new Map<Id<"users">, string>();
    for (const user of users ?? []) {
      const name = firstNameFromUser(user);
      if (name) map.set(user._id, name);
    }
    return map;
  })();

  const renderMessage = (message: ChatBodyMessage) => {
    const isStreamingTarget = message._id === streamingTargetId;
    const isOtherUser = isOtherUserChatMessage(message, currentUserId);
    const senderFirstName =
      isOtherUser && message.userId
        ? firstNameByUserId.get(message.userId)
        : undefined;
    const precedingUser =
      message.role === "assistant"
        ? findPrecedingUserTurn(displayMessages, message._id)
        : undefined;

    return (
      <ChatMessage
        key={message._id}
        message={message}
        repoBasePath={repoBasePath}
        isLatestAssistantTurn={message._id === latestAssistantMessageId}
        showChangedFiles={!simpleView}
        {...(expandedByMessageId[message._id] !== undefined
          ? { changedFilesExpanded: expandedByMessageId[message._id] }
          : {})}
        onChangedFilesExpandedChange={setMessageExpanded}
        isOtherUser={isOtherUser}
        senderFirstName={senderFirstName}
        turnModel={precedingUser?.model}
        turnReasoningLevel={precedingUser?.reasoningLevel}
        turnCredentialSourceLabel={precedingUser?.credentialSourceLabel}
        streamingActivity={isStreamingTarget ? streamingActivity : undefined}
        streamingContent={isStreamingTarget ? streamingContent : undefined}
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
          {displayMessages.length === 0 ? (
            (emptyStateOverride ?? (
              <ConversationEmptyState title={emptyStateTitle} />
            ))
          ) : lastUserMessageIndex < 0 ? (
            displayMessages.map(renderMessage)
          ) : (
            <>
              {displayMessages.slice(0, lastUserMessageIndex).map(renderMessage)}
              <ChatLastTurn>
                {displayMessages.slice(lastUserMessageIndex).map(renderMessage)}
              </ChatLastTurn>
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton resetKey={conversationId} />
        <ChatJumpRail messages={jumpRailMessages} />
      </Conversation>
      {isArchived ? null : dockedQuestions ? (
        <ChatQuestionDock
          questions={dockedQuestions}
          onAnswer={handleQuestionAnswer}
          {...(blockingQuestions
            ? { onAnswerStructured: handleBlockingAnswer }
            : {})}
          isLoading={isAnsweringQuestion}
        />
      ) : (
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
          displayTraits={displayTraits}
          onTraitsChange={onTraitsChange}
          onSend={onSend}
          onCancel={onCancel}
          beforeQueuedContent={beforeQueuedContent}
          preInputContent={preInputContent}
          draft={draft}
          isDraftLoading={isDraftLoading}
          hasPendingContext={hasPendingContext}
        />
      )}
    </>
  );
}
