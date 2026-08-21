import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { DatabaseReader } from "../_generated/server";
import { authMutation, authQuery } from "../functions";
import { entityVisible } from "../numId";
import { createSession } from "./mutations";

/** Title of the persistent per-user orchestrator session. */
const ORCHESTRATOR_SESSION_TITLE = "Orchestrator";

/**
 * Everything the client needs to route to the master session. The master lives
 * in the normal session UI, so this is a pointer (repo + numId), not the doc.
 */
const orchestratorSessionValidator = v.object({
  sessionId: v.id("sessions"),
  numId: v.number(),
  owner: v.string(),
  name: v.string(),
  rootDirectory: v.optional(v.string()),
  /** A turn is in flight — the rail entry shows this, since the orchestrator is
   * excluded from the sessions list and its badges. */
  isExecuting: v.boolean(),
});

/**
 * Resolves the user's master session pointer, or null when it was never
 * created, was deleted/archived, or has no repo to route through.
 */
async function resolveOrchestratorSession(
  db: DatabaseReader,
  userId: Id<"users">,
) {
  const user = await db.get(userId);
  if (!user?.orchestratorSessionId) return null;
  const session = entityVisible(await db.get(user.orchestratorSessionId));
  if (!session || session.archived === true) return null;
  // A session without a numId has no URL, so it cannot be the master.
  if (session.numId === undefined) return null;
  const repo = await db.get(session.repoId);
  if (!repo) return null;
  return {
    sessionId: session._id,
    numId: session.numId,
    owner: repo.owner,
    name: repo.name,
    rootDirectory: repo.rootDirectory,
    isExecuting: session.activeWorkflowId !== undefined,
  };
}

/** The user's master session, or null when they do not have a live one. */
export const getOrchestratorSession = authQuery({
  args: {},
  returns: v.union(orchestratorSessionValidator, v.null()),
  handler: async (ctx) => await resolveOrchestratorSession(ctx.db, ctx.userId),
});

/**
 * Returns the user's live master session, creating one in `repoId` when it is
 * missing (never created, deleted, or archived). A replacement master repoints
 * the user at the new session — there is only ever one.
 */
export const ensureOrchestratorSession = authMutation({
  args: { repoId: v.id("githubRepos") },
  returns: orchestratorSessionValidator,
  handler: async (ctx, args) => {
    const existing = await resolveOrchestratorSession(ctx.db, ctx.userId);
    if (existing) return existing;
    // The old pointer could not serve (archived, or its home repo is gone) but
    // the row may still exist and still be flagged. Strip the flag before
    // creating the replacement so exactly one session is ever the
    // orchestrator — otherwise the sessions list shows two marked rows and
    // `list_agents` hides both from the fleet.
    const user = await ctx.db.get(ctx.userId);
    const stale = user?.orchestratorSessionId
      ? await ctx.db.get(user.orchestratorSessionId)
      : null;
    if (stale?.isOrchestrator === true) {
      await ctx.db.patch(stale._id, { isOrchestrator: undefined });
    }
    // `createSession` owns the repo access check and the sandbox startup path.
    const { sessionId, numId } = await createSession(ctx, {
      repoId: args.repoId,
      title: ORCHESTRATOR_SESSION_TITLE,
      isOrchestrator: true,
    });
    await ctx.db.patch(ctx.userId, { orchestratorSessionId: sessionId });
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");
    return {
      sessionId,
      numId,
      owner: repo.owner,
      name: repo.name,
      rootDirectory: repo.rootDirectory,
      // Freshly created: its first turn has not started yet.
      isExecuting: false,
    };
  },
});
