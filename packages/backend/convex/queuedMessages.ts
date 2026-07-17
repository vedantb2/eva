import { v } from "convex/values";
import { authMutation, authQuery, hasRepoAccess } from "./functions";
import { queuedMessageFields } from "./validators";

const parentIdValidator = queuedMessageFields.parentId;

const queuedMessageValidator = v.object({
  _id: v.id("queuedMessages"),
  _creationTime: v.number(),
  ...queuedMessageFields,
});

/** Lists queued messages for a parent entity, ordered by run order. */
export const listByParent = authQuery({
  args: { parentId: parentIdValidator },
  returns: v.array(queuedMessageValidator),
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    if (!parent || !parent.repoId) {
      return [];
    }
    if (!(await hasRepoAccess(ctx.db, parent.repoId, ctx.userId))) {
      return [];
    }
    return await ctx.db
      .query("queuedMessages")
      .withIndex("by_parent_and_order", (q) => q.eq("parentId", args.parentId))
      .order("asc")
      .collect();
  },
});

/** Updates the content of a queued message. */
export const update = authMutation({
  args: {
    id: v.id("queuedMessages"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const queuedMessage = await ctx.db.get(args.id);
    if (!queuedMessage) {
      throw new Error("Queued message not found");
    }
    const parent = await ctx.db.get(queuedMessage.parentId);
    if (!parent || !parent.repoId) {
      throw new Error("Queued message parent not found");
    }
    if (!(await hasRepoAccess(ctx.db, parent.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    const content = args.content.trim();
    if (!content) {
      throw new Error("Queued message cannot be empty");
    }

    await ctx.db.patch(args.id, { content });
    await ctx.db.patch(queuedMessage.parentId, { updatedAt: Date.now() });
    return null;
  },
});

/** Deletes a queued message and updates the parent's timestamp. */
export const remove = authMutation({
  args: {
    id: v.id("queuedMessages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const queuedMessage = await ctx.db.get(args.id);
    if (!queuedMessage) {
      return null;
    }
    const parent = await ctx.db.get(queuedMessage.parentId);
    if (!parent || !parent.repoId) {
      return null;
    }
    if (!(await hasRepoAccess(ctx.db, parent.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
    await ctx.db.patch(queuedMessage.parentId, { updatedAt: Date.now() });
    return null;
  },
});

/**
 * Rewrites the run order of a parent's queued messages. `orderedIds` is the
 * desired top-to-bottom order; each message's `order` is set to its 0-based
 * position. A later enqueue uses Date.now() (far larger), so newly queued
 * messages always land after a reordered set.
 */
export const reorder = authMutation({
  args: {
    parentId: parentIdValidator,
    orderedIds: v.array(v.id("queuedMessages")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    if (!parent || !parent.repoId) {
      throw new Error("Queued message parent not found");
    }
    if (!(await hasRepoAccess(ctx.db, parent.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    let index = 0;
    for (const id of args.orderedIds) {
      const queuedMessage = await ctx.db.get(id);
      if (!queuedMessage || queuedMessage.parentId !== args.parentId) {
        throw new Error("Queued message does not belong to this parent");
      }
      await ctx.db.patch(id, { order: index });
      index += 1;
    }
    await ctx.db.patch(args.parentId, { updatedAt: Date.now() });
    return null;
  },
});
