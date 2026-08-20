import type { FunctionReturnType } from "convex/server";
import type { api, Doc } from "@eva/backend";
import type { ChatBodyMessage } from "@/lib/components/chat/chatBodyUtils";

type AgentRun = FunctionReturnType<typeof api.agentRuns.listByTask>[number];

/**
 * The quick task's initial run, once it settled successfully. Its activity
 * log renders as the opening assistant turn of the sandbox chat instead of a
 * run accordion in the activity timeline — both surfaces key off this one
 * function so they can never disagree about which run moved. Failed and
 * cancelled runs stay in the timeline (that is where `run.error` and the raw
 * launch logs render), as does a success without a `resultSummary` (the chat
 * turn would have no reply text).
 */
export function findFirstRunChatTurnRun(
  runs: readonly AgentRun[] | undefined,
): AgentRun | undefined {
  let first: AgentRun | undefined;
  for (const run of runs ?? []) {
    const startedAt = run.startedAt ?? run._creationTime;
    if (!first || startedAt < (first.startedAt ?? first._creationTime)) {
      first = run;
    }
  }
  return first?.status === "success" && first.resultSummary ? first : undefined;
}

/**
 * The first run as a normal chat turn: the task prompt (title + description)
 * as the user message, the run's activity log + result summary as the
 * assistant reply. Ids are synthetic but stable so React keys and the
 * changed-files expansion map behave like real messages.
 */
export function buildFirstRunChatTurn({
  task,
  run,
  activityLog,
  attachments,
}: {
  task: Pick<
    Doc<"agentTasks">,
    "_id" | "title" | "description" | "createdAt" | "createdBy"
  >;
  run: AgentRun;
  /** Resolved log for the run — `null` when the run has none. */
  activityLog: string | null;
  /** Task attachments resolved to URLs, shown on the prompt bubble. */
  attachments?: { url: string | null; contentType: string | null }[];
}): ChatBodyMessage[] {
  const startedAt = run.startedAt ?? run._creationTime;
  return [
    {
      _id: `first-run-${run._id}-user`,
      _creationTime: task.createdAt,
      parentId: task._id,
      role: "user",
      content: task.description
        ? `${task.title}\n\n${task.description}`
        : task.title,
      timestamp: task.createdAt,
      userId: task.createdBy,
      // Snapshots stored on the run; findPrecedingUserTurn reads them off the
      // user turn to show the model icon under the assistant reply.
      ...(run.model !== undefined ? { model: run.model } : {}),
      ...(run.credentialSourceLabel !== undefined
        ? { credentialSourceLabel: run.credentialSourceLabel }
        : {}),
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    },
    {
      _id: `first-run-${run._id}-assistant`,
      _creationTime: startedAt,
      parentId: task._id,
      role: "assistant",
      content: run.resultSummary ?? "",
      ...(activityLog !== null ? { activityLog } : {}),
      timestamp: startedAt,
      // Always set: an assistant row without finishedAt reads as the live
      // streaming placeholder (findStreamingTargetMessage).
      finishedAt: run.finishedAt ?? startedAt,
    },
  ];
}
