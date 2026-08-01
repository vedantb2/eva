import { api, type Doc, type Id } from "@eva/backend";
import { useMutation } from "convex/react";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { useRef } from "react";
import { toast } from "sonner";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { usePaginatedChatMessages } from "./usePaginatedChatMessages";

type ChatParentId = FunctionArgs<
  typeof api.messages.listByParentPaginated
>["parentId"];

type SubmitTurnResult =
  | FunctionReturnType<typeof api.sessionWorkflow.submitTurn>
  | FunctionReturnType<typeof api.agentTaskChatWorkflow.submitTurn>
  | FunctionReturnType<typeof api.projectChatWorkflow.submitTurn>;

export type ChatActiveTurn = NonNullable<Doc<"sessions">["activeTurn"]>;

export type ChatCancellationTarget =
  | { kind: "active"; turn: ChatActiveTurn }
  | { kind: "pending"; turnId: string };

interface SubmitActionArgs {
  turnId: string;
  content: string;
  attachmentStorageIds?: Id<"_storage">[];
}

interface UseChatRuntimeArgs {
  parentId: ChatParentId;
  streamingEntityId: string;
  questionEntityId: string;
  activeTurn?: ChatActiveTurn;
  /** Compatibility-only display state for a pre-v2 workflow still draining. */
  legacyBusy?: boolean;
  submissionKey: string;
  submitAction: (args: SubmitActionArgs) => Promise<SubmitTurnResult>;
  cancelAction: (target: ChatCancellationTarget | undefined) => Promise<void>;
}

interface RetrySubmission {
  turnId: string;
  content: string;
  submissionKey: string;
  attachmentStorageIds?: Id<"_storage">[];
}

function sameAttachments(
  left: ReadonlyArray<Id<"_storage">> | undefined,
  right: ReadonlyArray<Id<"_storage">> | undefined,
): boolean {
  if (left === right) return true;
  if (left === undefined || right === undefined) return false;
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

/** Shared reactive runtime for session, task, and project sandbox chats. */
export function useChatRuntime({
  parentId,
  streamingEntityId,
  questionEntityId,
  activeTurn,
  legacyBusy = false,
  submissionKey,
  submitAction,
  cancelAction,
}: UseChatRuntimeArgs) {
  const pagination = usePaginatedChatMessages(parentId);
  const queuedMessages =
    useQuery(api.queuedMessages.listByParent, { parentId }) ?? [];
  const pendingMessages =
    useQuery(api.messages.listPendingByParent, { parentId }) ?? [];
  const streaming = useQuery(api.streaming.get, {
    entityId: streamingEntityId,
  });
  const activeQuestion = useQuery(api.pendingQuestions.getActive, {
    entityId: questionEntityId,
  });
  const answerPendingQuestion = useMutation(api.pendingQuestions.answer);
  const retrySubmissionRef = useRef<RetrySubmission | null>(null);

  const canonicalTurnIds = new Set(
    [...pagination.messages, ...queuedMessages].flatMap((message) =>
      message.turnId ? [message.turnId] : [],
    ),
  );
  const visiblePendingMessages = pendingMessages.filter(
    (message) =>
      message.turnId !== undefined && !canonicalTurnIds.has(message.turnId),
  );
  const activePendingMessages = visiblePendingMessages.filter(
    (message) => message.placement === "active",
  );
  const pendingQueuedMessages = visiblePendingMessages.filter(
    (message) => message.placement === "queued",
  );
  const optimisticActiveTurnId = activePendingMessages.find(
    (message) => message.turnId !== undefined,
  )?.turnId;

  const handleSend = async (
    content: string,
    attachmentStorageIds?: Id<"_storage">[],
  ) => {
    const retry = retrySubmissionRef.current;
    const canReuseTurn =
      retry !== null &&
      retry.content === content &&
      retry.submissionKey === submissionKey &&
      sameAttachments(retry.attachmentStorageIds, attachmentStorageIds);
    const turnId = canReuseTurn ? retry.turnId : crypto.randomUUID();
    const submission: RetrySubmission = {
      turnId,
      content,
      submissionKey,
      attachmentStorageIds,
    };
    retrySubmissionRef.current = submission;

    try {
      await submitAction({
        turnId,
        content,
        attachmentStorageIds,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Message could not be sent.",
      );
      throw error;
    }
    retrySubmissionRef.current = null;
  };

  const handleCancel = async () => {
    const target: ChatCancellationTarget | undefined = activeTurn
      ? { kind: "active", turn: activeTurn }
      : optimisticActiveTurnId
        ? { kind: "pending", turnId: optimisticActiveTurnId }
        : undefined;
    await cancelAction(target);
  };

  const handleAnswerBlockingQuestion = async (
    toolUseId: string,
    answers: Record<string, string>,
  ) => {
    if (activeQuestion === null || activeQuestion === undefined) {
      toast.error("That question is no longer active.");
      return;
    }
    if (activeQuestion.toolUseId !== toolUseId) {
      toast.error("That question belongs to an older turn.");
      return;
    }
    const result = await answerPendingQuestion({
      entityId: questionEntityId,
      questionId: activeQuestion.questionId,
      toolUseId,
      answer: JSON.stringify(answers),
      turnId: activeQuestion.turnId,
      assistantMessageId: activeQuestion.assistantMessageId,
      attempt: activeQuestion.attempt,
    });
    if (result.status === "stale") {
      toast.error("That question is no longer active.");
    }
  };

  return {
    ...pagination,
    messages: [...pagination.messages, ...activePendingMessages],
    queuedMessages,
    pendingQueuedMessages,
    streaming,
    activeQuestion,
    localTurnId:
      activePendingMessages[activePendingMessages.length - 1]?.turnId,
    isExecuting:
      activeTurn !== undefined ||
      optimisticActiveTurnId !== undefined ||
      legacyBusy,
    handleSend,
    handleCancel,
    handleAnswerBlockingQuestion,
  };
}
