"use client";

import { api, type Doc, type Id } from "@eva/backend";
import { useMutation } from "convex/react";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { useRef, useState } from "react";
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

export interface OptimisticChatTurn {
  turnId: string;
  placement: "active" | "queued";
  content: string;
  submittedAt: number;
  attachmentStorageIds?: Id<"_storage">[];
  model?: Doc<"messages">["model"];
  reasoningLevel?: Doc<"messages">["reasoningLevel"];
  mode?: Doc<"messages">["mode"];
  credentialSourceLabel?: string;
}

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
  optimisticMetadata?: Pick<
    OptimisticChatTurn,
    "model" | "reasoningLevel" | "mode" | "credentialSourceLabel"
  >;
  submitAction: (args: SubmitActionArgs) => Promise<SubmitTurnResult>;
  cancelAction: (activeTurn: ChatActiveTurn | undefined) => Promise<void>;
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

function isQueuedResult(result: SubmitTurnResult): boolean {
  return "queuedMessageId" in result;
}

/** Shared reactive runtime for session, task, and project sandbox chats. */
export function useChatRuntime({
  parentId,
  streamingEntityId,
  questionEntityId,
  activeTurn,
  legacyBusy = false,
  submissionKey,
  optimisticMetadata,
  submitAction,
  cancelAction,
}: UseChatRuntimeArgs) {
  const pagination = usePaginatedChatMessages(parentId);
  const queuedMessages =
    useQuery(api.queuedMessages.listByParent, { parentId }) ?? [];
  const streaming = useQuery(api.streaming.get, {
    entityId: streamingEntityId,
  });
  const activeQuestion = useQuery(api.pendingQuestions.getActive, {
    entityId: questionEntityId,
  });
  const answerPendingQuestion = useMutation(api.pendingQuestions.answer);
  const [optimisticTurn, setOptimisticTurn] =
    useState<OptimisticChatTurn | null>(null);
  const retrySubmissionRef = useRef<RetrySubmission | null>(null);

  const visibleOptimisticTurn =
    optimisticTurn !== null &&
    !pagination.messages.some(
      (message) => message.turnId === optimisticTurn.turnId,
    ) &&
    !queuedMessages.some((message) => message.turnId === optimisticTurn.turnId)
      ? optimisticTurn
      : null;

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
    const placement =
      activeTurn !== undefined || legacyBusy ? "queued" : "active";
    const submission: RetrySubmission = {
      turnId,
      content,
      submissionKey,
      attachmentStorageIds,
    };
    retrySubmissionRef.current = submission;
    setOptimisticTurn({
      turnId,
      placement,
      content,
      submittedAt: Date.now(),
      attachmentStorageIds,
      ...optimisticMetadata,
    });

    let result: Awaited<ReturnType<typeof submitAction>>;
    try {
      result = await submitAction({
        turnId,
        content,
        attachmentStorageIds,
      });
    } catch (error) {
      setOptimisticTurn((current) =>
        current?.turnId === turnId ? null : current,
      );
      toast.error(
        error instanceof Error ? error.message : "Message could not be sent.",
      );
      throw error;
    }
    retrySubmissionRef.current = null;
    const authoritativePlacement = isQueuedResult(result) ? "queued" : "active";
    setOptimisticTurn((current) =>
      current?.turnId === turnId
        ? { ...current, placement: authoritativePlacement }
        : current,
    );
  };

  const handleCancel = async () => {
    await cancelAction(activeTurn);
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
    queuedMessages,
    streaming,
    activeQuestion,
    optimisticTurn: visibleOptimisticTurn,
    isExecuting: activeTurn !== undefined || legacyBusy,
    handleSend,
    handleCancel,
    handleAnswerBlockingQuestion,
  };
}
