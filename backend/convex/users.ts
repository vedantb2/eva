import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("users") },
  returns: v.union(
    v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    return { firstName: user.firstName, lastName: user.lastName };
  },
});
