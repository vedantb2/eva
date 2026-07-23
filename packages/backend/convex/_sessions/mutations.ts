import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { DatabaseReader } from "../_generated/server";
import { authMutation, hasRepoAccess } from "../functions";
import { allocateNumId } from "../numId";
import {
  aiModelValidator,
  reasoningLevelValidator,
  roleValidator,
  sessionModeValidator,
  sessionStatusValidator,
} from "../validators";
import { workflow } from "../workflowManager";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import { resolveCredentialSourceLabel } from "../_userProviderAccounts/credentialSource";
import {
  assertProviderAccountOwnedBy,
  resolveDefaultProviderAccountId,
} from "../_userProviderAccounts/defaults";
import { schedulePrTitleSync } from "../_github/prTitleSync";
import { DEFAULT_SESSION_TITLE } from "./helpers";

/** Loads a session by id, throwing if it does not exist. */
async function getSessionOrThrow(
  db: DatabaseReader,
  id: Id<"sessions">,
): Promise<Doc<"sessions">> {
  const session = await db.get(id);
  if (!session) {
    throw new Error("Session not found");
  }
  return session;
}

/** Creates a new session with a sandbox startup workflow. */
export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.optional(v.string()),
    message: v.optional(v.string()),
    mode: v.optional(sessionModeValidator),
    model: v.optional(aiModelValidator),
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    providerAccountId: v.optional(
      v.union(v.id("userProviderAccounts"), v.null()),
    ),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.object({
    sessionId: v.id("sessions"),
    numId: v.number(),
  }),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");
    const title = args.title?.trim() || DEFAULT_SESSION_TITLE;
    const numId = await allocateNumId(ctx.db, args.repoId, "sessions");
    const model = args.model ?? repo.defaultModel;
    const providerAccountId =
      args.providerAccountId === undefined
        ? await resolveDefaultProviderAccountId(ctx.db, ctx.userId, model)
        : await assertProviderAccountOwnedBy(
            ctx.db,
            args.providerAccountId,
            ctx.userId,
          );
    const sessionId = await ctx.db.insert("sessions", {
      repoId: args.repoId,
      userId: ctx.userId,
      title,
      status: "starting",
      createdBy: ctx.userId,
      updatedAt: Date.now(),
      numId,
      providerAccountId,
      lastModel: model,
      ...(args.mode !== undefined ? { lastMode: args.mode } : {}),
      ...(args.reasoningLevel !== undefined
        ? { lastReasoningLevel: args.reasoningLevel }
        : {}),
      ...(args.thinkingEnabled !== undefined
        ? { lastThinkingEnabled: args.thinkingEnabled }
        : {}),
      ...(args.use1mContext !== undefined
        ? { lastUse1mContext: args.use1mContext }
        : {}),
    });
    const branchName = `eva/session-${sessionId}`;
    await ctx.db.patch(sessionId, { branchName });
    const baseBranch = repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH;
    await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionSandboxStartupWorkflow,
      {
        sessionId,
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName,
        baseBranch,
        repoId: args.repoId,
      },
    );

    const content = args.message?.trim() ?? "";
    if (content) {
      if (!args.mode || !args.model) {
        throw new Error("mode and model are required when queuing a message");
      }
      await ctx.db.insert("queuedMessages", {
        parentId: sessionId,
        content,
        createdAt: Date.now(),
        order: Date.now(),
        userId: ctx.userId,
        mode: args.mode,
        model: args.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        providerAccountId,
        attachmentStorageIds: args.attachmentStorageIds,
      });
      if (title === DEFAULT_SESSION_TITLE) {
        await ctx.scheduler.runAfter(0, internal.textGen.generateSessionTitle, {
          sessionId,
          message: content,
        });
      }
    }

    return { sessionId, numId };
  },
});

/** Adds a message to a session conversation. */
export const addMessage = authMutation({
  args: {
    id: v.id("sessions"),
    role: roleValidator,
    content: v.string(),
    mode: v.optional(sessionModeValidator),
    activityLog: v.optional(v.string()),
    clientId: v.optional(v.string()),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    model: v.optional(aiModelValidator),
    reasoningLevel: v.optional(reasoningLevelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await getSessionOrThrow(ctx.db, args.id);
    const credentialSourceLabel =
      args.role === "user"
        ? await resolveCredentialSourceLabel(
            ctx.db,
            args.providerAccountId ?? session.providerAccountId,
            session.createdBy ?? session.userId,
          )
        : undefined;
    await ctx.db.insert("messages", {
      parentId: args.id,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      mode: args.mode,
      activityLog: args.activityLog,
      clientId: args.clientId,
      userId: ctx.userId,
      attachmentStorageIds: args.attachmentStorageIds,
      credentialSourceLabel,
      ...(args.role === "user"
        ? {
            model: args.model,
            reasoningLevel: args.reasoningLevel,
          }
        : {}),
    });
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
    return null;
  },
});

/**
 * Sets the sticky composer model for a session. `lastModel` is the single
 * source of truth for the picker, so this is called directly on change (with a
 * client-side optimistic update) rather than only when a message is sent. Does
 * not touch `updatedAt` — changing the model is not conversation activity and
 * must not reorder the session list.
 */
export const setModel = authMutation({
  args: {
    id: v.id("sessions"),
    model: aiModelValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await getSessionOrThrow(ctx.db, args.id);
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.id, { lastModel: args.model });
    return null;
  },
});

/**
 * Sets the sticky composer mode for a session. Same contract as `setModel`:
 * write on change (optimistic on the client), do not bump `updatedAt`.
 */
export const setMode = authMutation({
  args: {
    id: v.id("sessions"),
    mode: sessionModeValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await getSessionOrThrow(ctx.db, args.id);
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.id, { lastMode: args.mode });
    return null;
  },
});

/**
 * Sets the sticky provider account for a session (owner-only). Same contract as
 * `setModel`: write on change (optimistic on the client), do not bump
 * `updatedAt`. Pass `null` to clear back to Team.
 */
export const setProviderAccountId = authMutation({
  args: {
    id: v.id("sessions"),
    providerAccountId: v.union(v.id("userProviderAccounts"), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await getSessionOrThrow(ctx.db, args.id);
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const ownerUserId = session.createdBy ?? session.userId;
    if (ctx.userId !== ownerUserId) {
      throw new Error("Only the session owner can change the provider account");
    }
    const providerAccountId = await assertProviderAccountOwnedBy(
      ctx.db,
      args.providerAccountId,
      ownerUserId,
    );
    await ctx.db.patch(args.id, { providerAccountId });
    return null;
  },
});

/**
 * Sets sticky composer traits for a session (effort / thinking / 1M). Same
 * contract as `setModel`: write on change (optimistic on the client), do not
 * bump `updatedAt`. Only provided fields are patched.
 */
export const setTraits = authMutation({
  args: {
    id: v.id("sessions"),
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await getSessionOrThrow(ctx.db, args.id);
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    if (
      args.reasoningLevel === undefined &&
      args.thinkingEnabled === undefined &&
      args.use1mContext === undefined
    ) {
      return null;
    }
    await ctx.db.patch(args.id, {
      ...(args.reasoningLevel !== undefined
        ? { lastReasoningLevel: args.reasoningLevel }
        : {}),
      ...(args.thinkingEnabled !== undefined
        ? { lastThinkingEnabled: args.thinkingEnabled }
        : {}),
      ...(args.use1mContext !== undefined
        ? { lastUse1mContext: args.use1mContext }
        : {}),
    });
    return null;
  },
});

/** Updates the status of a session. */
export const updateStatus = authMutation({
  args: {
    id: v.id("sessions"),
    status: sessionStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getSessionOrThrow(ctx.db, args.id);
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});

/** Updates editable fields (title, branch, PR URL) on a session. */
export const update = authMutation({
  args: {
    id: v.id("sessions"),
    title: v.optional(v.string()),
    branchName: v.optional(v.string()),
    prUrl: v.optional(v.string()),
    captureProofEnabled: v.optional(v.boolean()),
    runAuditEnabled: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await getSessionOrThrow(ctx.db, args.id);
    const updates: {
      title?: string;
      branchName?: string;
      prUrl?: string;
      captureProofEnabled?: boolean;
      runAuditEnabled?: boolean;
    } = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.branchName !== undefined) updates.branchName = args.branchName;
    if (args.prUrl !== undefined) updates.prUrl = args.prUrl;
    if (args.captureProofEnabled !== undefined)
      updates.captureProofEnabled = args.captureProofEnabled;
    if (args.runAuditEnabled !== undefined)
      updates.runAuditEnabled = args.runAuditEnabled;
    await ctx.db.patch(args.id, updates);

    if (
      args.title !== undefined &&
      args.title !== session.title &&
      session.prUrl
    ) {
      await schedulePrTitleSync(ctx, {
        repoId: session.repoId,
        prUrl: session.prUrl,
        title: args.title,
      });
    }
    return null;
  },
});

/** Updates the summary bullet points on a session. */
export const updateSummary = authMutation({
  args: {
    id: v.id("sessions"),
    summary: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { summary: args.summary });
    return null;
  },
});

/** Archives a session so it no longer appears in the active list.
 * Also archives the Daytona sandbox (moves to cold storage for cost savings). */
export const archive = authMutation({
  args: { id: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await getSessionOrThrow(ctx.db, args.id);
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    // Archive the Daytona sandbox (stops it first, then moves to cold storage)
    if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.archiveSandbox, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      });
    }

    await ctx.db.patch(args.id, {
      archived: true,
      status: "closed",
    });
    return null;
  },
});

/** Unarchives a session, restoring it to the active list. */
export const unarchive = authMutation({
  args: { id: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await getSessionOrThrow(ctx.db, args.id);
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.id, { archived: false });
    return null;
  },
});

/** Stores or updates the plan content for a session. */
export const updatePlanContent = authMutation({
  args: {
    id: v.id("sessions"),
    planContent: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await getSessionOrThrow(ctx.db, args.id);
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.id, {
      planContent: args.planContent,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Updates the content or activity log of the most recent message in a session. */
export const updateLastMessage = authMutation({
  args: {
    id: v.id("sessions"),
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await getSessionOrThrow(ctx.db, args.id);
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .order("desc")
      .first();
    if (!last) return null;
    const patch: { content?: string; activityLog?: string } = {};
    if (args.content !== undefined) patch.content = args.content;
    if (args.activityLog !== undefined) patch.activityLog = args.activityLog;
    await ctx.db.patch(last._id, patch);
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
    return null;
  },
});

/** Clears the agent-browsing soft lock so the user can take over the shared browser. */
export const releaseBrowserLock = authMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await getSessionOrThrow(ctx.db, args.sessionId);
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.sessionId, {
      agentBrowsingAt: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});
