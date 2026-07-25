import { v } from "convex/values";
import { internal } from "../_generated/api";
import { workflow, cancelTrackedWorkflow } from "../workflowManager";
import {
  aiModelValidator,
  normalizeAIModel,
  reasoningLevelValidator,
} from "../validators";
import { authMutation, hasRepoAccess } from "../functions";
import { trackDesignSessionWorkflow } from "../workflowWatchdog";
import { clearStreamingActivity } from "../_taskWorkflow/helpers";
import { startNextQueuedDesignMessage } from "../_queues/helpers";
import { resolveCredentialSourceLabel } from "../_userProviderAccounts/credentialSource";
import { assertProviderAccountOwnedBy } from "../_userProviderAccounts/defaults";

/** Sends a message to the AI for design generation, starting a workflow with timeout watchdog. */
export const executeMessage = authMutation({
  args: {
    id: v.id("designSessions"),
    message: v.string(),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    personaId: v.optional(v.id("designPersonas")),
    numDesigns: v.optional(v.number()),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");

    const normalizedModel = normalizeAIModel(args.model);
    const stickyProviderAccountId = await assertProviderAccountOwnedBy(
      ctx.db,
      args.providerAccountId,
      session.userId,
    );

    const now = Date.now();
    await ctx.db.insert("messages", {
      parentId: args.id,
      role: "user",
      content: args.message,
      timestamp: now,
      userId: ctx.userId,
      personaId: args.personaId,
      attachmentStorageIds: args.attachmentStorageIds,
      credentialSourceLabel: await resolveCredentialSourceLabel(
        ctx.db,
        stickyProviderAccountId,
        session.userId,
      ),
      model: normalizedModel,
      reasoningLevel: args.reasoningLevel,
    });
    await ctx.db.insert("messages", {
      parentId: args.id,
      role: "assistant",
      content: "",
      timestamp: now,
      activityLog: "",
    });
    await ctx.db.patch(args.id, {
      updatedAt: now,
      lastModel: normalizedModel,
      providerAccountId: stickyProviderAccountId,
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

    const workflowId = await workflow.start(
      ctx,
      internal.designWorkflow.designSessionWorkflow,
      {
        designSessionId: args.id,
        message: args.message,
        model: normalizedModel,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        providerAccountId: stickyProviderAccountId,
        credentialOwnerUserId: session.userId,
        personaId: args.personaId,
        userId: ctx.userId,
        numDesigns: args.numDesigns ?? 3,
      },
    );

    await trackDesignSessionWorkflow(ctx, args.id, workflowId);

    return null;
  },
});

/** Queues a message for later execution when the session is busy. */
export const enqueueMessage = authMutation({
  args: {
    id: v.id("designSessions"),
    message: v.string(),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    personaId: v.optional(v.id("designPersonas")),
    numDesigns: v.optional(v.number()),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const content = args.message.trim();
    if (!content) return null;

    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    const normalizedModel = normalizeAIModel(args.model);
    const stickyProviderAccountId = await assertProviderAccountOwnedBy(
      ctx.db,
      args.providerAccountId,
      session.userId,
    );

    await ctx.db.insert("queuedMessages", {
      parentId: args.id,
      content,
      createdAt: Date.now(),
      order: Date.now(),
      userId: ctx.userId,
      model: normalizedModel,
      reasoningLevel: args.reasoningLevel,
      thinkingEnabled: args.thinkingEnabled,
      use1mContext: args.use1mContext,
      providerAccountId: stickyProviderAccountId,
      personaId: args.personaId,
      numDesigns: args.numDesigns ?? 3,
      attachmentStorageIds: args.attachmentStorageIds,
    });
    await ctx.db.patch(args.id, {
      updatedAt: Date.now(),
      lastModel: normalizedModel,
      providerAccountId: stickyProviderAccountId,
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

/** Cancels the active design workflow and starts processing any queued messages. */
export const cancelExecution = authMutation({
  args: { id: v.id("designSessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");

    await cancelTrackedWorkflow(ctx, session.activeWorkflowId);

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .order("desc")
      .first();
    if (last && last.role === "assistant" && !last.content) {
      await ctx.db.patch(last._id, {
        content: "Design generation cancelled.",
      });
    }

    await clearStreamingActivity(ctx, String(args.id));

    await ctx.db.patch(args.id, {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    await startNextQueuedDesignMessage(ctx, args.id);
    return null;
  },
});
