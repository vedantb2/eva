import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export type SessionDaemonPatch = Pick<
  Doc<"sessions">,
  | "pendingTurn"
  | "pendingTaskStops"
  | "cancelRequestedAt"
  | "sandboxSetupPending"
  | "claimPausedUntil"
> & {
  usageRefreshRequestedAt?: number;
};

/** Mirrors daemon-only session fields into the small row polled by warm agents. */
export async function syncSessionDaemonState(
  ctx: MutationCtx,
  session: Doc<"sessions">,
  patch: Partial<SessionDaemonPatch>,
): Promise<void> {
  const state = await ctx.db
    .query("sessionDaemonStates")
    .withIndex("by_session", (q) => q.eq("sessionId", session._id))
    .unique();

  if (state) {
    await ctx.db.patch(state._id, patch);
    return;
  }

  await ctx.db.insert("sessionDaemonStates", {
    sessionId: session._id,
    repoId: session.repoId,
    userId: session.userId,
    pendingTurn: Object.hasOwn(patch, "pendingTurn")
      ? patch.pendingTurn
      : session.pendingTurn,
    pendingTaskStops: Object.hasOwn(patch, "pendingTaskStops")
      ? patch.pendingTaskStops
      : session.pendingTaskStops,
    cancelRequestedAt: Object.hasOwn(patch, "cancelRequestedAt")
      ? patch.cancelRequestedAt
      : session.cancelRequestedAt,
    sandboxSetupPending: Object.hasOwn(patch, "sandboxSetupPending")
      ? patch.sandboxSetupPending
      : session.sandboxSetupPending,
    usageRefreshRequestedAt: Object.hasOwn(patch, "usageRefreshRequestedAt")
      ? patch.usageRefreshRequestedAt
      : undefined,
    claimPausedUntil: Object.hasOwn(patch, "claimPausedUntil")
      ? patch.claimPausedUntil
      : session.claimPausedUntil,
  });
}

/** Creates the small daemon row lazily for sessions predating this split. */
export async function ensureSessionDaemonState(
  ctx: MutationCtx,
  session: Doc<"sessions">,
): Promise<void> {
  await syncSessionDaemonState(ctx, session, {});
}
