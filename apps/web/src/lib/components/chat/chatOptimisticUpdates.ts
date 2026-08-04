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

function buildOptimisticPendingTurn(args: {
  current: ReadonlyArray<PendingMessage>;
  userMessage: PendingMessageDraft;
  userId: NonNullable<PendingMessage["userId"]>;
  submittedAt: number;
  parentIsBusy: boolean;
}): PendingMessage[] {
  const retained = args.current.filter(
    (candidate) => candidate.turnId !== args.userMessage.turnId,
  );
  const placement =
    args.parentIsBusy || retained.length > 0 ? "queued" : "active";
  const userMessage: PendingMessage = {
    ...args.userMessage,
    _id: `turn:${args.userMessage.turnId}:user`,
    _creationTime: args.submittedAt,
    timestamp: args.submittedAt,
    userId: args.userId,
    placement,
  };
  if (placement === "queued") return [...retained, userMessage];

  // Match the server-created assistant row so reconciliation keeps one stable
  // timeline key while showing the standard Thinking UI immediately.
  const assistantMessage: PendingMessage = {
    _id: `turn:${args.userMessage.turnId}:assistant`,
    _creationTime: args.submittedAt + 1,
    parentId: args.userMessage.parentId,
    role: "assistant",
    content: "",
    timestamp: args.submittedAt + 1,
    activityLog: "",
    turnId: args.userMessage.turnId,
    mode: args.userMessage.mode,
    placement: "active",
  };
  return [...retained, userMessage, assistantMessage];
}

function writePendingTurn(
  localStore: OptimisticLocalStore,
  userMessage: PendingMessageDraft,
  parentIsBusy: boolean,
): void {
  const current =
    localStore.getQuery(api.messages.listPendingByParent, {
      parentId: userMessage.parentId,
    }) ?? [];
  const userId = localStore.getQuery(api.auth.me, {});
  if (userId === undefined) return;

  localStore.setQuery(
    api.messages.listPendingByParent,
    { parentId: userMessage.parentId },
    buildOptimisticPendingTurn({
      current,
      userMessage,
      userId,
      submittedAt: Date.now(),
      parentIsBusy,
    }),
  );
}

/** Optimistic session submission projected through Convex's local query cache. */
export function optimisticallySubmitSessionTurn(
  localStore: OptimisticLocalStore,
  args: SessionSubmitArgs,
): void {
  const session = localStore.getQuery(api.sessions.get, { id: args.sessionId });
  writePendingTurn(
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
  writePendingTurn(
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
  writePendingTurn(
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
