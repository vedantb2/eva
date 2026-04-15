import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { authMutation } from "../functions";

/** Updates the PTY session ID on a session (user-facing). */
export const updatePtySession = authMutation({
  args: {
    id: v.id("sessions"),
    ptySessionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, {
      ptySessionId: args.ptySessionId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Updates the PTY session ID on a session (internal use, no auth check). */
export const updatePtySessionInternal = internalMutation({
  args: {
    id: v.id("sessions"),
    ptySessionId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) {
      throw new Error("Session not found");
    }
    await ctx.db.patch(args.id, {
      ptySessionId: args.ptySessionId,
      updatedAt: Date.now(),
    });
    return null;
  },
});
