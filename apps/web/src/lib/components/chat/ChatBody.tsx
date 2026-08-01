import {
  ConversationEmptyState,
  Message as AIMessage,
  MessageContent,
  type ModelOption,
  type ModelAccount,
} from "@eva/ui";
import { ChatComposer } from "@/lib/components/chat/ChatComposer";
import { ChatMessage } from "@/lib/components/chat/ChatMessage";
import { ChatVirtualizedTimeline } from "./ChatVirtualizedTimeline";
import { MultipleChoiceQuestion } from "@/lib/components/plan/MultipleChoiceQuestion";
import type { ChatAttachmentMode } from "@/lib/components/chat/imageAttachments";
import { useRef, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import {
  api,
  type AIModel,
  type Id,
  type ProviderComposerCapability,
  type StoredModelTraits,
  type resolveTraitsForDisplay,
} from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import type { ChatDraftSeed } from "@/lib/components/chat/useChatDraftSeed";
import {
  firstNameFromUser,
  isOtherUserChatMessage,
  parsePendingQuestion,
  type ChatBodyMessage,
  type ChatBodyQueuedMessage,
} from "@/lib/components/chat/chatBodyUtils";
import { ChatTimelineProjector, type ChatTimelineRow } from "./chatTimeline";
import type { ChatActiveTurn, OptimisticChatTurn } from "./useChatRuntime";
import { ReviewCommentMessage } from "./ReviewCommentMessage";

export type { ChatBodyMessage };

type StreamingState = NonNullable<FunctionReturnType<typeof api.streaming.get>>;

type ActiveQuestion = NonNullable<
  FunctionReturnType<typeof api.pendingQuestions.getActive>
>;

interface ChatBodyProps {
  repoId: Id<"githubRepos">;
  repoBasePath: string;
  conversationId: string;
  messages: ChatBodyMessage[];
  queuedMessages: ChatBodyQueuedMessage[];
  activeTurn?: ChatActiveTurn;
  streaming?: StreamingState;
  blockingQuestion?: ActiveQuestion;
  optimisticTurn?: OptimisticChatTurn | null;
  history: {
    firstItemIndex: number;
    canLoadOlder: boolean;
    isLoadingOlder: boolean;
    onLoadOlder: () => void;
  };
  onAnswerBlockingQuestion?: (
    toolUseId: string,
    answers: Record<string, string>,
  ) => Promise<void>;
  availability: {
    isExecuting: boolean;
    isInputDisabled: boolean;
    isArchived?: boolean;
  };
  placeholder: string;
  emptyStateTitle: string;
  model: AIModel;
  setModel: (model: AIModel) => void;
  modelOptions: ReadonlyArray<ModelOption<AIModel>>;
  accounts?: ReadonlyArray<ModelAccount>;
  accountId?: string | null;
  onAccountChange?: (accountId: string | null) => void;
  displayTraits?: ReturnType<typeof resolveTraitsForDisplay>;
  providerCapabilities?: ReadonlyArray<ProviderComposerCapability>;
  onTraitsChange?: (partial: Partial<StoredModelTraits>) => void;
  onSend: (
    content: string,
    attachmentStorageIds?: Id<"_storage">[],
  ) => Promise<void>;
  onCancel: () => Promise<void>;
  preConversationContent?: React.ReactNode;
  beforeQueuedContent?: React.ReactNode;
  preInputContent?: React.ReactNode;
  toolsBefore?: React.ReactNode;
  optionsSubmenu?: React.ReactNode;
  emptyStateOverride?: React.ReactNode;
  draft?: ChatDraftSeed;
  isDraftLoading?: boolean;
  onOpenFile?: (path: string) => void;
  onViewDiff?: (repoRelativePath?: string) => void;
  hasPendingContext?: boolean;
  attachmentMode?: ChatAttachmentMode;
}

function OptimisticMessage({
  row,
  repoBasePath,
}: {
  row: Extract<
    ChatTimelineRow,
    { kind: "optimisticUser" | "optimisticAssistant" }
  >;
  repoBasePath: string;
}) {
  const isUser = row.kind === "optimisticUser";
  return (
    <div data-message-id={row.id} aria-busy="true">
      <AIMessage from={isUser ? "user" : "assistant"}>
        <MessageContent
          className={
            isUser
              ? "group rounded-surface bg-secondary px-4 py-3 text-foreground opacity-80"
              : "px-1 py-2 text-sm text-muted-foreground"
          }
        >
          {isUser ? (
            <>
              <ReviewCommentMessage
                text={row.turn.content}
                repoBasePath={repoBasePath}
              />
              {row.turn.attachmentStorageIds?.length ? (
                <div className="mt-2 text-xs text-muted-foreground">
                  {row.turn.attachmentStorageIds.length} attachment
                  {row.turn.attachmentStorageIds.length === 1 ? "" : "s"}
                </div>
              ) : null}
            </>
          ) : (
            <span className="animate-pulse">Submitting turn…</span>
          )}
        </MessageContent>
      </AIMessage>
    </div>
  );
}

export function ChatBody({
  repoId,
  repoBasePath,
  conversationId,
  messages,
  queuedMessages,
  activeTurn,
  streaming,
  blockingQuestion,
  optimisticTurn,
  history,
  onAnswerBlockingQuestion,
  availability,
  placeholder,
  emptyStateTitle,
  model,
  setModel,
  modelOptions,
  accounts,
  accountId,
  onAccountChange,
  displayTraits,
  providerCapabilities,
  onTraitsChange,
  onSend,
  onCancel,
  preConversationContent,
  beforeQueuedContent,
  preInputContent,
  toolsBefore,
  optionsSubmenu,
  emptyStateOverride,
  draft,
  isDraftLoading,
  onOpenFile,
  onViewDiff,
  hasPendingContext,
  attachmentMode = "images",
}: ChatBodyProps) {
  const { firstItemIndex, canLoadOlder, isLoadingOlder, onLoadOlder } = history;
  const { isExecuting, isInputDisabled, isArchived } = availability;
  const [timelineProjector] = useState(() => new ChatTimelineProjector());
  const [isAnsweringQuestion, setIsAnsweringQuestion] = useState(false);
  const answeringQuestionRef = useRef<string | null>(null);
  const timeline = timelineProjector.project({
    messages,
    streaming,
    activeQuestion: blockingQuestion,
    activeTurn,
    optimisticTurn,
  });
  const blockingQuestions = blockingQuestion
    ? parsePendingQuestion(blockingQuestion.payload)
    : null;

  const handleBlockingAnswer = async (answers: Record<string, string>) => {
    if (!blockingQuestion || !onAnswerBlockingQuestion) return;
    if (answeringQuestionRef.current !== null) return;
    const toolUseId = blockingQuestion.toolUseId;
    answeringQuestionRef.current = toolUseId;
    setIsAnsweringQuestion(true);
    try {
      await onAnswerBlockingQuestion(toolUseId, answers);
    } catch (error) {
      if (answeringQuestionRef.current === toolUseId) {
        answeringQuestionRef.current = null;
        setIsAnsweringQuestion(false);
      }
      throw error;
    }
    if (answeringQuestionRef.current === toolUseId) {
      answeringQuestionRef.current = null;
      setIsAnsweringQuestion(false);
    }
  };

  const currentUserId = useQuery(api.auth.me);
  const users = useQuery(api.users.listAll);
  const firstNameByUserId = new Map<Id<"users">, string>();
  for (const user of users ?? []) {
    const name = firstNameFromUser(user);
    if (name) firstNameByUserId.set(user._id, name);
  }

  const renderRow = (row: ChatTimelineRow) => {
    if (row.kind !== "message") {
      return <OptimisticMessage row={row} repoBasePath={repoBasePath} />;
    }
    const isOtherUser = isOtherUserChatMessage(row.message, currentUserId);
    const senderFirstName =
      isOtherUser && row.message.userId
        ? firstNameByUserId.get(row.message.userId)
        : undefined;
    return (
      <ChatMessage
        message={row.message}
        repoBasePath={repoBasePath}
        isLast={row.isLast}
        isOtherUser={isOtherUser}
        senderFirstName={senderFirstName}
        turnModel={row.precedingUser?.model}
        turnReasoningLevel={row.precedingUser?.reasoningLevel}
        turnCredentialSourceLabel={row.precedingUser?.credentialSourceLabel}
        streamingActivity={row.stream?.currentActivity}
        streamingContent={row.stream?.currentContent}
        blockingQuestions={row.question ? blockingQuestions : undefined}
        isQuestionLoading={isAnsweringQuestion}
        onBlockingAnswer={handleBlockingAnswer}
        onOpenFile={onOpenFile}
        onViewDiff={onViewDiff}
      />
    );
  };

  const standaloneQuestion =
    blockingQuestions && !timeline.questionAttached ? (
      <MultipleChoiceQuestion
        key={blockingQuestion?.toolUseId}
        questions={blockingQuestions}
        onAnswer={() => undefined}
        onAnswerStructured={handleBlockingAnswer}
        isLoading={isAnsweringQuestion}
      />
    ) : null;

  return (
    <>
      {preConversationContent}
      <ChatVirtualizedTimeline
        conversationId={conversationId}
        rows={timeline.rows}
        firstItemIndex={firstItemIndex}
        anchors={timeline.jumpAnchors}
        canLoadOlder={canLoadOlder}
        isLoadingOlder={isLoadingOlder}
        onLoadOlder={onLoadOlder}
        localTurnId={optimisticTurn?.turnId}
        emptyState={
          emptyStateOverride ?? (
            <ConversationEmptyState title={emptyStateTitle} />
          )
        }
        footer={standaloneQuestion}
        renderRow={renderRow}
      />
      {!isArchived && !blockingQuestions ? (
        <ChatComposer
          repoId={repoId}
          repoBasePath={repoBasePath}
          conversationId={conversationId}
          queuedMessages={queuedMessages}
          optimisticTurn={optimisticTurn}
          messageHistory={timeline.messageHistory}
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
          providerCapabilities={providerCapabilities}
          onTraitsChange={onTraitsChange}
          onSend={onSend}
          onCancel={onCancel}
          beforeQueuedContent={beforeQueuedContent}
          preInputContent={preInputContent}
          toolsBefore={toolsBefore}
          optionsSubmenu={optionsSubmenu}
          draft={draft}
          isDraftLoading={isDraftLoading}
          hasPendingContext={hasPendingContext}
          attachmentMode={attachmentMode}
        />
      ) : null}
    </>
  );
}
