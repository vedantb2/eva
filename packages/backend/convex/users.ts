import { v } from "convex/values";
import { roleUserValidator } from "./validators";
import { authQuery } from "./functions";

export const get = authQuery({
  args: { id: v.id("users") },
  returns: v.union(
    v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      lastSeenAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      lastSeenAt: user.lastSeenAt,
    };
  },
});

export const listAll = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("users"),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      fullName: v.optional(v.string()),
      role: v.optional(roleUserValidator),
    }),
  ),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: u.fullName,
      role: u.role,
    }));
  },
});
