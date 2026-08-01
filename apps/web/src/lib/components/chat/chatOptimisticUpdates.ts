import { api } from "@eva/backend";
import type { OptimisticLocalStore } from "convex/browser";
import type { FunctionArgs, FunctionReturnType } from "convex/server";

type PendingMessage = FunctionReturnType<
  typeof api.messages.listPendingByParent
>[number];

type SessionSubmitArgs = FunctionArgs<typeof api.sessionWorkflow.submitTurn>;

type TaskSubmitArgs = FunctionArgs<typeof api.agentTaskChatWorkflow.submitTurn>;

type ProjectSubmitArgs = FunctionArgs<
  typeof api.projectChatWorkflow.submitTurn
>;

type PendingMessageDraft = Omit<
  PendingMessage,
  "_id" | "_creationTime" | "placement" | "timestamp" | "turnId" | "userId"
> & {
  turnId: NonNullable<PendingMessage["turnId"]>;
};

function writePendingMessage(
  localStore: OptimisticLocalStore,
  message: PendingMessageDraft,
  parentIsBusy: boolean,
): void {
  const current =
    localStore.getQuery(api.messages.listPendingByParent, {
      parentId: message.parentId,
    }) ?? [];
  const userId = localStore.getQuery(api.auth.me, {});
  if (userId === undefined) return;

  const submittedAt = Date.now();
  const pendingMessage: PendingMessage = {
    ...message,
    _id: `turn:${message.turnId}:user`,
    _creationTime: submittedAt,
    timestamp: submittedAt,
    userId,
    placement: parentIsBusy || current.length > 0 ? "queued" : "active",
  };
  localStore.setQuery(
    api.messages.listPendingByParent,
    { parentId: message.parentId },
    [
      ...current.filter((candidate) => candidate.turnId !== message.turnId),
      pendingMessage,
    ],
  );
}

/** Optimistic session submission projected through Convex's local query cache. */
export function optimisticallySubmitSessionTurn(
  localStore: OptimisticLocalStore,
  args: SessionSubmitArgs,
): void {
  const session = localStore.getQuery(api.sessions.get, { id: args.sessionId });
  writePendingMessage(
    localStore,
    {
      parentId: args.sessionId,
      role: "user",
      content: args.displayContent ?? args.message,
      turnId: args.turnId,
      mode: args.mode,
      model: args.model,
      reasoningLevel: args.reasoningLevel,
      attachmentStorageIds: args.attachmentStorageIds,
      personaId: args.personaId,
    },
    session !== null &&
      session !== undefined &&
      (session.activeTurn !== undefined ||
        session.activeWorkflowId !== undefined ||
        session.pendingTurn !== undefined),
  );
}

/** Optimistic task-chat submission projected through Convex's local cache. */
export function optimisticallySubmitTaskTurn(
  localStore: OptimisticLocalStore,
  args: TaskSubmitArgs,
): void {
  const task = localStore.getQuery(api.agentTasks.get, { id: args.taskId });
  writePendingMessage(
    localStore,
    {
      parentId: args.taskId,
      role: "user",
      content: args.message,
      turnId: args.turnId,
      model: args.model,
      reasoningLevel: args.reasoningLevel,
      attachmentStorageIds: args.attachmentStorageIds,
    },
    task !== null &&
      task !== undefined &&
      (task.activeTurn !== undefined ||
        task.activeChatWorkflowId !== undefined ||
        task.pendingTurn !== undefined),
  );
}

/** Optimistic project-chat submission projected through Convex's local cache. */
export function optimisticallySubmitProjectTurn(
  localStore: OptimisticLocalStore,
  args: ProjectSubmitArgs,
): void {
  const project = localStore.getQuery(api.projects.get, { id: args.projectId });
  writePendingMessage(
    localStore,
    {
      parentId: args.projectId,
      role: "user",
      content: args.message,
      turnId: args.turnId,
      model: args.model,
      reasoningLevel: args.reasoningLevel,
      attachmentStorageIds: args.attachmentStorageIds,
    },
    project !== null &&
      project !== undefined &&
      (project.activeTurn !== undefined ||
        project.activeChatWorkflowId !== undefined ||
        project.pendingTurn !== undefined),
  );
}
