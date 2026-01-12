import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";

const conversationMessageValidator = v.object({
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
});

const planValidator = v.object({
  _id: v.id("plans"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  rawInput: v.string(),
  generatedSpec: v.optional(v.string()),
  state: v.union(
    v.literal("draft"),
    v.literal("finalized"),
    v.literal("feature_created")
  ),
  conversationHistory: v.array(conversationMessageValidator),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(planValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("plans")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("plans") },
  returns: v.union(planValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    const plan = await ctx.db.get(args.id);
    if (!plan) {
      return null;
    }
    return plan;
  },
});

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    rawInput: v.string(),
  },
  returns: v.id("plans"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.db.insert("plans", {
      repoId: args.repoId,
      userId,
      title: args.title,
      rawInput: args.rawInput,
      state: "draft",
      conversationHistory: [
        {
          role: "user",
          content: args.rawInput,
        },
      ],
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("plans"),
    title: v.optional(v.string()),
    generatedSpec: v.optional(v.string()),
    state: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("finalized"),
        v.literal("feature_created")
      )
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const plan = await ctx.db.get(args.id);
    if (!plan) {
      throw new Error("Plan not found");
    }
    const updates: {
      title?: string;
      generatedSpec?: string;
      state?: "draft" | "finalized" | "feature_created";
    } = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.generatedSpec !== undefined) updates.generatedSpec = args.generatedSpec;
    if (args.state !== undefined) updates.state = args.state;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const addMessage = mutation({
  args: {
    id: v.id("plans"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const plan = await ctx.db.get(args.id);
    if (!plan) {
      throw new Error("Plan not found");
    }
    await ctx.db.patch(args.id, {
      conversationHistory: [
        ...plan.conversationHistory,
        { role: args.role, content: args.content },
      ],
    });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("plans") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const plan = await ctx.db.get(args.id);
    if (!plan) {
      throw new Error("Plan not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
