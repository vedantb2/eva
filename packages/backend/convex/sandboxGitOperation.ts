import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/** Atomic cross-workflow lease for git fetch/rebase/push in one sandbox. */
export const claim = internalMutation({
  args: { sandboxId: v.string(), owner: v.string(), leaseMs: v.number() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sandboxGitOperationLeases")
      .withIndex("by_sandbox", (q) => q.eq("sandboxId", args.sandboxId))
      .first();
    const now = Date.now();
    if (existing && existing.expiresAt > now && existing.owner !== args.owner) {
      return false;
    }
    if (existing) {
      await ctx.db.patch(existing._id, {
        owner: args.owner,
        expiresAt: now + args.leaseMs,
      });
    } else {
      await ctx.db.insert("sandboxGitOperationLeases", {
        sandboxId: args.sandboxId,
        owner: args.owner,
        expiresAt: now + args.leaseMs,
      });
    }
    return true;
  },
});

export const release = internalMutation({
  args: { sandboxId: v.string(), owner: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sandboxGitOperationLeases")
      .withIndex("by_sandbox", (q) => q.eq("sandboxId", args.sandboxId))
      .first();
    if (existing?.owner === args.owner) await ctx.db.delete(existing._id);
    return null;
  },
});
