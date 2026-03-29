import { v } from "convex/values";
import { authQuery, hasRepoAccess } from "./functions";
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
