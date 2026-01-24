import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";

const messageValidator = v.object({
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
  timestamp: v.number(),
});

const researchQueryValidator = v.object({
  _id: v.id("researchQueries"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  messages: v.array(messageValidator),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(researchQueryValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("researchQueries")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("researchQueries") },
  returns: v.union(researchQueryValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
  },
  returns: v.id("researchQueries"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const now = Date.now();
    return await ctx.db.insert("researchQueries", {
      repoId: args.repoId,
      userId,
      title: args.title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMessage = mutation({
  args: {
    id: v.id("researchQueries"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const query = await ctx.db.get(args.id);
    if (!query) {
      throw new Error("Query not found");
    }
    await ctx.db.patch(args.id, {
      messages: [
        ...query.messages,
        { role: args.role, content: args.content, timestamp: Date.now() },
      ],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const update = mutation({
  args: {
    id: v.id("researchQueries"),
    title: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const query = await ctx.db.get(args.id);
    if (!query) {
      throw new Error("Query not found");
    }
    const updates: { title?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("researchQueries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const query = await ctx.db.get(args.id);
    if (!query) {
      throw new Error("Query not found");
    }
    if (query.userId !== userId) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const getNoAuth = query({
  args: { id: v.id("researchQueries") },
  returns: v.union(researchQueryValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const addMessageNoAuth = mutation({
  args: {
    id: v.id("researchQueries"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const researchQuery = await ctx.db.get(args.id);
    if (!researchQuery) {
      throw new Error("Query not found");
    }
    await ctx.db.patch(args.id, {
      messages: [
        ...researchQuery.messages,
        { role: args.role, content: args.content, timestamp: Date.now() },
      ],
      updatedAt: Date.now(),
    });
    return null;
  },
});

const schemaInfoValidator = v.object({
  tables: v.array(
    v.object({
      name: v.string(),
      fields: v.array(v.string()),
      description: v.string(),
    })
  ),
  availableQueries: v.array(v.string()),
});

export const getSchemaInfo = query({
  args: { repoId: v.id("githubRepos") },
  returns: schemaInfoValidator,
  handler: async () => {
    return {
      tables: [
        {
          name: "agentTasks",
          fields: ["title", "status", "boardId", "createdAt", "updatedAt", "description"],
          description: "Work items/tasks on kanban boards",
        },
        {
          name: "features",
          fields: ["title", "status", "branchName", "description"],
          description: "Feature branches (planning, active, completed, archived)",
        },
        {
          name: "sessions",
          fields: ["title", "status", "messages", "archived"],
          description: "Chat sessions with the AI assistant",
        },
        {
          name: "agentRuns",
          fields: ["status", "startedAt", "finishedAt", "prUrl", "logs"],
          description: "Task execution history with PR URLs and logs",
        },
        {
          name: "boards",
          fields: ["name", "repoId"],
          description: "Kanban boards linked to repositories",
        },
      ],
      availableQueries: [
        "api.analytics.getTaskStats",
        "api.analytics.getRunStats",
        "api.analytics.getSessionStats",
        "api.analytics.getFeatureStats",
        "api.agentTasks.list",
        "api.features.list",
        "api.sessions.list",
      ],
    };
  },
});
