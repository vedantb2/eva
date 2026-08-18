import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Leaf module for the orchestrator-notify hook surface. The turn-finish call
// sites (`_taskWorkflow/helpers.ts`, `_taskWorkflow/publicMutations.ts`) import
// from here rather than `orchestratorNotify.ts`, whose own imports (workflow
// manager, watchdog, streaming helpers) would otherwise close import cycles in
// the "use node" action chunk and break the prod push.

/** Identifies the finished child a master session is being woken about. */
export const orchestratorNotifyChildValidator = v.union(
  v.object({ kind: v.literal("session"), sessionId: v.id("sessions") }),
  v.object({ kind: v.literal("task"), taskId: v.id("agentTasks") }),
);

/** The `child` payload of `notifyOrchestratorOfChild`, for hook call sites. */
export type OrchestratorNotifyChild =
  | { kind: "session"; sessionId: Id<"sessions"> }
  | { kind: "task"; taskId: Id<"agentTasks"> };

/**
 * Schedules a master wake-up for a finished quick-task run. No-op when the task
 * is not watched, so run completion pays one read and nothing else.
 */
export async function scheduleTaskOrchestratorNotify(
  ctx: MutationCtx,
  taskId: Id<"agentTasks">,
  status: string,
): Promise<void> {
  const task = await ctx.db.get(taskId);
  if (!task || task.watchedByOrchestrator === undefined) return;
  await ctx.scheduler.runAfter(
    0,
    internal.orchestratorNotify.notifyOrchestratorOfChild,
    { child: { kind: "task", taskId }, status },
  );
}
