import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";
import { Id } from "./_generated/dataModel";

const dependencyValidator = v.object({
  _id: v.id("taskDependencies"),
  _creationTime: v.number(),
  taskId: v.id("agentTasks"),
  dependsOnId: v.id("agentTasks"),
});

export const getForTask = query({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(dependencyValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("taskDependencies")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

export const getDependents = query({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(dependencyValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("taskDependencies")
      .withIndex("by_dependency", (q) => q.eq("dependsOnId", args.taskId))
      .collect();
  },
});

export const isBlocked = query({
  args: { taskId: v.id("agentTasks") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return false;
    }
    const dependencies = await ctx.db
      .query("taskDependencies")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    for (const dep of dependencies) {
      const dependsOnTask = await ctx.db.get(dep.dependsOnId);
      if (dependsOnTask && dependsOnTask.status !== "done") {
        return true;
      }
    }
    return false;
  },
});

export const add = mutation({
  args: {
    taskId: v.id("agentTasks"),
    dependsOnId: v.id("agentTasks"),
  },
  returns: v.id("taskDependencies"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    if (args.taskId === args.dependsOnId) {
      throw new Error("A task cannot depend on itself");
    }
    const existing = await ctx.db
      .query("taskDependencies")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("dependsOnId"), args.dependsOnId))
      .first();
    if (existing) {
      throw new Error("Dependency already exists");
    }
    return await ctx.db.insert("taskDependencies", {
      taskId: args.taskId,
      dependsOnId: args.dependsOnId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("taskDependencies") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const dep = await ctx.db.get(args.id);
    if (!dep) {
      throw new Error("Dependency not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const removeByTasks = mutation({
  args: {
    taskId: v.id("agentTasks"),
    dependsOnId: v.id("agentTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const dep = await ctx.db
      .query("taskDependencies")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) => q.eq(q.field("dependsOnId"), args.dependsOnId))
      .first();
    if (dep) {
      await ctx.db.delete(dep._id);
    }
    return null;
  },
});
