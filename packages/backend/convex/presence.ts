import { components } from "./_generated/api";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Presence } from "@convex-dev/presence";
import { authQuery, authMutation } from "./functions";
import { getCurrentUserId } from "./auth";

const presence = new Presence(components.presence);

const TWO_MINUTES = 2 * 60 * 1000;

export const heartbeat = authMutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    if (userId !== ctx.userId) {
      throw new Error("Cannot send heartbeat for another user");
    }
    const result = await presence.heartbeat(
      ctx,
      roomId,
      userId,
      sessionId,
      interval,
    );
    const user = await ctx.db.get(ctx.userId);
    if (
      user &&
      (!user.lastSeenAt || Date.now() - user.lastSeenAt > TWO_MINUTES)
    ) {
      await ctx.db.patch(ctx.userId, { lastSeenAt: Date.now() });
    }
    return result;
  },
});

export const list = authQuery({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken);
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  returns: v.null(),
  handler: async (ctx, { sessionToken }) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    await presence.disconnect(ctx, sessionToken);
    return null;
  },
});
