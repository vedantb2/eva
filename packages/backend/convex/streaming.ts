import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
} from "./_generated/server";
import { authQuery, authMutation } from "./functions";

/** Gets the current streaming activity state for an entity (task, session, etc.). */
export const get = authQuery({
  args: { entityId: v.string() },
  returns: v.union(
    v.object({
      currentActivity: v.string(),
      currentContent: v.string(),
      pendingQuestion: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .first();
    if (!streaming) return null;
    return {
      currentActivity: streaming.currentActivity,
      currentContent: streaming.currentContent ?? "",
      pendingQuestion: streaming.pendingQuestion,
    };
  },
});

/** Updates or creates streaming activity state for an entity, only writing on actual changes. */
export const set = authMutation({
  args: {
    entityId: v.string(),
    currentActivity: v.string(),
    currentContent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .first();
    const now = Date.now();
    const nextContent = args.currentContent ?? "";
    if (existing) {
      const activityChanged = existing.currentActivity !== args.currentActivity;
      const contentChanged = (existing.currentContent ?? "") !== nextContent;
      const questionChanged =
        (existing.pendingQuestion ?? "") !== (args.pendingQuestion ?? "");
      if (activityChanged || contentChanged || questionChanged) {
        await ctx.db.patch(existing._id, {
          currentActivity: args.currentActivity,
          currentContent: nextContent,
          pendingQuestion: args.pendingQuestion,
          lastUpdatedAt: now,
        });
      } else {
        await ctx.db.patch(existing._id, {
          lastUpdatedAt: now,
        });
      }
    } else {
      await ctx.db.insert("streamingActivity", {
        entityId: args.entityId,
        currentActivity: args.currentActivity,
        currentContent: nextContent,
        pendingQuestion: args.pendingQuestion,
        lastUpdatedAt: now,
      });
    }
    return null;
  },
});

/** Gets streaming activity state (internal use, no auth check). */
export const internalGet = internalQuery({
  args: { entityId: v.string() },
  returns: v.union(
    v.object({
      currentActivity: v.string(),
      currentContent: v.string(),
      pendingQuestion: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .first();
    if (!streaming) return null;
    return {
      currentActivity: streaming.currentActivity,
      currentContent: streaming.currentContent ?? "",
      pendingQuestion: streaming.pendingQuestion,
    };
  },
});

async function touchStreamingEntity(
  ctx: MutationCtx,
  entityId: string,
): Promise<boolean> {
  const now = Date.now();
  const existing = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", entityId))
    .first();
  if (!existing) {
    await ctx.db.insert("streamingActivity", {
      entityId,
      currentActivity: "[]",
      currentContent: "",
      lastUpdatedAt: now,
    });
    return true;
  }
  await ctx.db.patch(existing._id, { lastUpdatedAt: now });
  return true;
}

/** Bumps lastUpdatedAt only — used for lightweight watchdog heartbeats (callback token). */
export const touch = authMutation({
  args: { entityId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => touchStreamingEntity(ctx, args.entityId),
});

/** Internal touch for HTTP heartbeat route and liveness probe refresh. */
export const internalTouch = internalMutation({
  args: { entityId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => touchStreamingEntity(ctx, args.entityId),
});

/** Updates or creates streaming activity state (internal use, no auth check). */
export const internalSet = internalMutation({
  args: {
    entityId: v.string(),
    currentActivity: v.string(),
    currentContent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .first();
    const now = Date.now();
    const nextContent = args.currentContent ?? "";
    if (existing) {
      const activityChanged = existing.currentActivity !== args.currentActivity;
      const contentChanged = (existing.currentContent ?? "") !== nextContent;
      const questionChanged =
        (existing.pendingQuestion ?? "") !== (args.pendingQuestion ?? "");
      if (activityChanged || contentChanged || questionChanged) {
        await ctx.db.patch(existing._id, {
          currentActivity: args.currentActivity,
          currentContent: nextContent,
          pendingQuestion: args.pendingQuestion,
          lastUpdatedAt: now,
        });
      } else {
        await ctx.db.patch(existing._id, {
          lastUpdatedAt: now,
        });
      }
    } else {
      await ctx.db.insert("streamingActivity", {
        entityId: args.entityId,
        currentActivity: args.currentActivity,
        currentContent: nextContent,
        pendingQuestion: args.pendingQuestion,
        lastUpdatedAt: now,
      });
    }
    return null;
  },
});

/** Removes the streaming activity record for an entity. */
export const clear = authMutation({
  args: { entityId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});
