import { v } from "convex/values";
import { authMutation, authQuery, hasRepoAccess } from "./functions";
import { queuedMessageFields } from "./validators";

const parentIdValidator = queuedMessageFields.parentId;

const queuedMessageValidator = v.object({
  _id: v.id("queuedMessages"),
  _creationTime: v.number(),
  ...queuedMessageFields,
});

export const listByParent = authQuery({
  args: { parentId: parentIdValidator },
  returns: v.array(queuedMessageValidator),
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);
    if (!parent) {
      return [];
    }
    if (!(await hasRepoAccess(ctx.db, parent.repoId, ctx.userId))) {
      return [];
    }
    return await ctx.db
      .query("queuedMessages")
      .withIndex("by_parent_and_created", (q) =>
        q.eq("parentId", args.parentId),
      )
      .order("asc")
      .collect();
  },
});

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
    if (!parent) {
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
    if (!parent) {
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
