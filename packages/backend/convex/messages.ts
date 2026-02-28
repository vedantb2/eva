import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { authQuery, authMutation } from "./functions";
import {
  roleValidator,
  sessionModeValidator,
  queryConfirmationStatusValidator,
  variationValidator,
} from "./validators";

const parentIdValidator = v.union(
  v.id("sessions"),
  v.id("designSessions"),
  v.id("researchQueries"),
);

const messageValidator = v.object({
  _id: v.id("messages"),
  _creationTime: v.number(),
  role: roleValidator,
  content: v.string(),
  timestamp: v.number(),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
  parentId: parentIdValidator,
  mode: v.optional(sessionModeValidator),
  isSystemAlert: v.optional(v.boolean()),
  errorDetail: v.optional(v.string()),
  personaId: v.optional(v.id("designPersonas")),
  variations: v.optional(v.array(variationValidator)),
  queryCode: v.optional(v.string()),
  status: v.optional(queryConfirmationStatusValidator),
});

export const listByParent = authQuery({
  args: { parentId: parentIdValidator },
  returns: v.array(messageValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
  },
});

export const listByParentInternal = internalQuery({
  args: { parentId: parentIdValidator },
  returns: v.array(messageValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
  },
});

export const add = authMutation({
  args: {
    parentId: parentIdValidator,
    role: roleValidator,
    content: v.string(),
    mode: v.optional(sessionModeValidator),
    activityLog: v.optional(v.string()),
    isSystemAlert: v.optional(v.boolean()),
    errorDetail: v.optional(v.string()),
    personaId: v.optional(v.id("designPersonas")),
    variations: v.optional(v.array(variationValidator)),
    queryCode: v.optional(v.string()),
    status: v.optional(queryConfirmationStatusValidator),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      parentId: args.parentId,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      userId: ctx.userId,
      mode: args.mode,
      activityLog: args.activityLog,
      isSystemAlert: args.isSystemAlert,
      errorDetail: args.errorDetail,
      personaId: args.personaId,
      variations: args.variations,
      queryCode: args.queryCode,
      status: args.status,
    });
  },
});

export const addInternal = internalMutation({
  args: {
    parentId: parentIdValidator,
    role: roleValidator,
    content: v.string(),
    timestamp: v.optional(v.number()),
    userId: v.optional(v.id("users")),
    mode: v.optional(sessionModeValidator),
    activityLog: v.optional(v.string()),
    isSystemAlert: v.optional(v.boolean()),
    errorDetail: v.optional(v.string()),
    personaId: v.optional(v.id("designPersonas")),
    variations: v.optional(v.array(variationValidator)),
    queryCode: v.optional(v.string()),
    status: v.optional(queryConfirmationStatusValidator),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      parentId: args.parentId,
      role: args.role,
      content: args.content,
      timestamp: args.timestamp ?? Date.now(),
      userId: args.userId,
      mode: args.mode,
      activityLog: args.activityLog,
      isSystemAlert: args.isSystemAlert,
      errorDetail: args.errorDetail,
      personaId: args.personaId,
      variations: args.variations,
      queryCode: args.queryCode,
      status: args.status,
    });
  },
});

export const updateLastInternal = internalMutation({
  args: {
    parentId: parentIdValidator,
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
    variations: v.optional(v.array(variationValidator)),
    queryCode: v.optional(v.string()),
    status: v.optional(queryConfirmationStatusValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .order("desc")
      .first();
    if (!last) return null;

    const patch: {
      content?: string;
      activityLog?: string;
      variations?: Array<{
        label: string;
        route?: string;
        filePath?: string;
      }>;
      queryCode?: string;
      status?: "pending" | "confirmed" | "cancelled";
    } = {};
    if (args.content !== undefined) patch.content = args.content;
    if (args.activityLog !== undefined) patch.activityLog = args.activityLog;
    if (args.variations !== undefined) patch.variations = args.variations;
    if (args.queryCode !== undefined) patch.queryCode = args.queryCode;
    if (args.status !== undefined) patch.status = args.status;

    await ctx.db.patch(last._id, patch);
    return null;
  },
});

export const updateLast = authMutation({
  args: {
    parentId: parentIdValidator,
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
    variations: v.optional(v.array(variationValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .order("desc")
      .first();
    if (!last) return null;

    const patch: {
      content?: string;
      activityLog?: string;
      variations?: Array<{
        label: string;
        route?: string;
        filePath?: string;
      }>;
    } = {};
    if (args.content !== undefined) patch.content = args.content;
    if (args.activityLog !== undefined) patch.activityLog = args.activityLog;
    if (args.variations !== undefined) patch.variations = args.variations;

    await ctx.db.patch(last._id, patch);
    return null;
  },
});

export const patchMessage = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.optional(v.string()),
    activityLog: v.optional(v.string()),
    variations: v.optional(v.array(variationValidator)),
    queryCode: v.optional(v.string()),
    status: v.optional(queryConfirmationStatusValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: {
      content?: string;
      activityLog?: string;
      variations?: Array<{
        label: string;
        route?: string;
        filePath?: string;
      }>;
      queryCode?: string;
      status?: "pending" | "confirmed" | "cancelled";
    } = {};
    if (args.content !== undefined) patch.content = args.content;
    if (args.activityLog !== undefined) patch.activityLog = args.activityLog;
    if (args.variations !== undefined) patch.variations = args.variations;
    if (args.queryCode !== undefined) patch.queryCode = args.queryCode;
    if (args.status !== undefined) patch.status = args.status;

    await ctx.db.patch(args.messageId, patch);
    return null;
  },
});

export const clearByParent = authMutation({
  args: { parentId: parentIdValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    return null;
  },
});

export const clearByParentInternal = internalMutation({
  args: { parentId: parentIdValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    return null;
  },
});
