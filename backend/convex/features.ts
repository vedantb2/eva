import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";

const featureValidator = v.object({
  _id: v.id("features"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  planId: v.optional(v.id("plans")),
  title: v.string(),
  description: v.optional(v.string()),
  branchName: v.string(),
  status: v.union(
    v.literal("planning"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("archived")
  ),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(featureValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("features")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("features") },
  returns: v.union(featureValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(args.id);
  },
});

export const getByPlan = query({
  args: { planId: v.id("plans") },
  returns: v.union(featureValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db
      .query("features")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .first();
  },
});

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    planId: v.optional(v.id("plans")),
    title: v.string(),
    description: v.optional(v.string()),
    branchName: v.string(),
  },
  returns: v.id("features"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.db.insert("features", {
      repoId: args.repoId,
      userId,
      planId: args.planId,
      title: args.title,
      description: args.description,
      branchName: args.branchName,
      status: "planning",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("features"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("planning"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const feature = await ctx.db.get(args.id);
    if (!feature) {
      throw new Error("Feature not found");
    }
    const updates: {
      title?: string;
      description?: string;
      status?: "planning" | "active" | "completed" | "archived";
    } = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) updates.status = args.status;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("features") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const feature = await ctx.db.get(args.id);
    if (!feature) {
      throw new Error("Feature not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

interface ParsedTask {
  title: string;
  description: string;
  dependencies: number[];
}

interface ParsedSpec {
  title: string;
  description: string;
  tasks: ParsedTask[];
}

function parseSpec(specJson: string): ParsedSpec {
  const parsed = JSON.parse(specJson);
  return {
    title: parsed.title ?? "",
    description: parsed.description ?? "",
    tasks: (parsed.tasks ?? []).map(
      (t: { title?: string; description?: string; dependencies?: number[] }) => ({
        title: t.title ?? "",
        description: t.description ?? "",
        dependencies: t.dependencies ?? [],
      })
    ),
  };
}

export const createFromPlan = mutation({
  args: {
    planId: v.id("plans"),
  },
  returns: v.id("features"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Plan not found");
    }
    if (!plan.generatedSpec) {
      throw new Error("Plan has no generated spec");
    }
    const spec = parseSpec(plan.generatedSpec);
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);
    const branchName = `conductor/feature-${slugify(spec.title)}`;
    const featureId = await ctx.db.insert("features", {
      repoId: plan.repoId,
      userId,
      planId: args.planId,
      title: spec.title,
      description: spec.description,
      branchName,
      status: "planning",
    });
    let board = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", plan.repoId))
      .first();
    if (!board) {
      const boardId = await ctx.db.insert("boards", {
        name: "Feature Tasks",
        ownerId: identity.subject,
        repoId: plan.repoId,
        createdAt: Date.now(),
      });
      board = await ctx.db.get(boardId);
    }
    if (!board) {
      throw new Error("Failed to get or create board");
    }
    let column = await ctx.db
      .query("columns")
      .withIndex("by_board", (q) => q.eq("boardId", board._id))
      .first();
    if (!column) {
      const columnId = await ctx.db.insert("columns", {
        boardId: board._id,
        name: "Backlog",
        order: 0,
        isRunColumn: false,
      });
      column = await ctx.db.get(columnId);
    }
    if (!column) {
      throw new Error("Failed to get or create column");
    }
    const taskIdMap: Map<number, ReturnType<typeof v.id<"agentTasks">>> = new Map();
    const now = Date.now();
    for (let i = 0; i < spec.tasks.length; i++) {
      const task = spec.tasks[i];
      const taskNumber = i + 1;
      const taskBranchName = `${branchName}-${taskNumber}`;
      const taskId = await ctx.db.insert("agentTasks", {
        boardId: board._id,
        columnId: column._id,
        title: task.title,
        description: task.description,
        branchName: taskBranchName,
        repoId: plan.repoId,
        featureId,
        taskNumber,
        status: "backlog",
        order: i,
        createdAt: now,
        updatedAt: now,
      });
      taskIdMap.set(taskNumber, taskId);
    }
    for (let i = 0; i < spec.tasks.length; i++) {
      const task = spec.tasks[i];
      const taskNumber = i + 1;
      const taskId = taskIdMap.get(taskNumber);
      if (!taskId) continue;
      for (const depNumber of task.dependencies) {
        const depTaskId = taskIdMap.get(depNumber);
        if (depTaskId) {
          await ctx.db.insert("taskDependencies", {
            taskId,
            dependsOnId: depTaskId,
          });
        }
      }
    }
    await ctx.db.patch(args.planId, { state: "feature_created" });
    return featureId;
  },
});
