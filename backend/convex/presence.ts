import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";
import { getCurrentUserId } from "./auth";

const presence = new Presence(components.presence);

const ONE_MINUTE = 60 * 1000;

export const heartbeat = mutation({
  args: { roomId: v.string(), userId: v.string(), sessionId: v.string(), interval: v.number() },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    const result = await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
    const currentUserId = await getCurrentUserId(ctx);
    if (currentUserId) {
      const user = await ctx.db.get(currentUserId);
      if (user && (!user.lastSeenAt || Date.now() - user.lastSeenAt > ONE_MINUTE)) {
        await ctx.db.patch(currentUserId, { lastSeenAt: Date.now() });
      }
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
