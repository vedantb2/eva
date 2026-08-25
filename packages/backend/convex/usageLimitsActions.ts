import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authAction, getActionRepoWithAccess } from "./functions";
import { usageLimitProviderValidator } from "./validators";

/**
 * On-demand plan-usage refresh. The chip's button calls this; the reading
 * still comes from the live Claude Agent SDK daemon (`usage_EXPERIMENTAL`),
 * the same path a turn already uses.
 *
 * Eva's servers must not POST `/v1/messages` with a stored setup-token just
 * to harvest rate-limit headers — that is the OpenCode-shaped third-party
 * inference path. A stopped sandbox cannot answer, and must not be exec'd
 * (Vercel `withResume` would wake it).
 *
 * Prewarm runs before the one-shot flag is set so a stale callback bundle
 * can upload and respawn before an old daemon drains the flag as a no-op.
 */

const PREWARM_SETTLE_MS = 1_000;
const POLL_INTERVAL_MS = 500;
const POLL_ATTEMPTS = 40;

type RefreshFailure = "sandbox-idle" | "unavailable";

type RefreshTargetArgs = {
  sessionId?: Id<"sessions">;
  projectId?: Id<"projects">;
  taskId?: Id<"agentTasks">;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function targetArgs(args: RefreshTargetArgs): RefreshTargetArgs {
  return {
    ...(args.sessionId === undefined ? {} : { sessionId: args.sessionId }),
    ...(args.projectId === undefined ? {} : { projectId: args.projectId }),
    ...(args.taskId === undefined ? {} : { taskId: args.taskId }),
  };
}

async function prewarmSurface(
  ctx: ActionCtx,
  args: RefreshTargetArgs,
): Promise<void> {
  if (args.sessionId !== undefined) {
    await ctx.runAction(api.sessionWorkflow.prewarmDaemonNow, {
      sessionId: args.sessionId,
    });
    return;
  }
  if (args.projectId !== undefined) {
    await ctx.runAction(api.projectChatWorkflow.prewarmChatDaemonNow, {
      projectId: args.projectId,
    });
    return;
  }
  if (args.taskId !== undefined) {
    await ctx.runAction(api.agentTaskChatWorkflow.prewarmChatDaemonNow, {
      taskId: args.taskId,
    });
  }
}

/**
 * Asks the live Claude daemon to report plan usage now, instead of waiting
 * for the next turn. Stopped sandboxes return `sandbox-idle`.
 */
export const refresh = authAction({
  args: {
    repoId: v.id("githubRepos"),
    provider: usageLimitProviderValidator,
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    sessionId: v.optional(v.id("sessions")),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("agentTasks")),
  },
  returns: v.object({ ok: v.boolean(), reason: v.optional(v.string()) }),
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: boolean; reason?: RefreshFailure }> => {
    await getActionRepoWithAccess(ctx, args.repoId);
    if (args.provider !== "claude") {
      return { ok: false, reason: "unavailable" };
    }
    const surfaceArgs = targetArgs(args);
    const surface = await ctx.runQuery(internal.usageLimits.getRefreshSurface, {
      userId: ctx.userId,
      repoId: args.repoId,
      ...surfaceArgs,
    });
    if (surface === "idle") {
      return { ok: false, reason: "sandbox-idle" };
    }

    // Upload a stale callback (if any) then give the old process a beat to
    // exit, then prewarm again so a cold sandbox actually launches.
    await prewarmSurface(ctx, surfaceArgs);
    await sleep(PREWARM_SETTLE_MS);
    await prewarmSurface(ctx, surfaceArgs);

    const accountArg =
      args.providerAccountId === undefined
        ? {}
        : { providerAccountId: args.providerAccountId };
    const before = await ctx.runQuery(internal.usageLimits.getReadingInternal, {
      repoId: args.repoId,
      provider: args.provider,
      ...accountArg,
    });
    const beforeCapturedAt = before?.capturedAt ?? 0;

    const requested = await ctx.runMutation(api.usageLimits.requestRefresh, {
      repoId: args.repoId,
      ...surfaceArgs,
    });
    if (!requested) return { ok: false, reason: "sandbox-idle" };

    for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
      await sleep(POLL_INTERVAL_MS);
      const reading = await ctx.runQuery(
        internal.usageLimits.getReadingInternal,
        {
          repoId: args.repoId,
          provider: args.provider,
          ...accountArg,
        },
      );
      if (reading !== null && reading.capturedAt > beforeCapturedAt) {
        return { ok: true };
      }
    }
    return { ok: false, reason: "unavailable" };
  },
});
