import { v } from "convex/values";
import { internal } from "../_generated/api";
import { workflow, cancelTrackedWorkflow } from "../workflowManager";
import { aiModelValidator, normalizeAIModel } from "../validators";
import { authMutation, hasRepoAccess } from "../functions";
import { trackDesignSessionWorkflow } from "../workflowWatchdog";
import { clearStreamingActivity } from "../_taskWorkflow/helpers";
import { startNextQueuedDesignMessage } from "../_queues/helpers";
import { resolveCredentialSourceLabel } from "../_userProviderAccounts/credentialSource";

/** Sends a message to the AI for design generation, starting a workflow with timeout watchdog. */
export const executeMessage = authMutation({
  args: {
    id: v.id("designSessions"),
    message: v.string(),
    model: aiModelValidator,
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    personaId: v.optional(v.id("designPersonas")),
    numDesigns: v.optional(v.number()),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Design session not found");

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
        args.providerAccountId,
        ctx.userId,
      ),
    });
    await ctx.db.insert("messages", {
      parentId: args.id,
      role: "assistant",
      content: "",
      timestamp: now,
      activityLog: "",
    });
    await ctx.db.patch(args.id, { updatedAt: now });

    const workflowId = await workflow.start(
      ctx,
      internal.designWorkflow.designSessionWorkflow,
      {
        designSessionId: args.id,
        message: args.message,
        model: normalizeAIModel(args.model),
        providerAccountId: args.providerAccountId,
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

    await ctx.db.insert("queuedMessages", {
      parentId: args.id,
      content,
      createdAt: Date.now(),
      order: Date.now(),
      userId: ctx.userId,
      model: normalizeAIModel(args.model),
      providerAccountId: args.providerAccountId,
      personaId: args.personaId,
      numDesigns: args.numDesigns ?? 3,
      attachmentStorageIds: args.attachmentStorageIds,
    });
    await ctx.db.patch(args.id, { updatedAt: Date.now() });
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
