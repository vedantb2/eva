import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";
import { authMutation } from "./functions";

const presence = new Presence(components.presence);

const FIVE_MINUTES = 5 * 60 * 1000;

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
      (!user.lastSeenAt || Date.now() - user.lastSeenAt > FIVE_MINUTES)
    ) {
      await ctx.db.patch(ctx.userId, { lastSeenAt: Date.now() });
    }
    return result;
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken);
  },
});

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken);
  },
});
