import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";

const dependencyValidator = v.object({
  _id: v.id("taskDependencies"),
  _creationTime: v.number(),
  taskId: v.id("agentTasks"),
  dependsOnId: v.id("agentTasks"),
});

export const getForTask = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(dependencyValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("taskDependencies")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

export const getDependents = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(dependencyValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("taskDependencies")
      .withIndex("by_dependency", (q) => q.eq("dependsOnId", args.taskId))
      .collect();
  },
});

export const getDependencies = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(
    v.object({
      _id: v.id("agentTasks"),
      title: v.string(),
      status: v.string(),
      taskNumber: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const dependencies = await ctx.db
      .query("taskDependencies")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const result = [];
    for (const dep of dependencies) {
      const task = await ctx.db.get(dep.dependsOnId);
      if (task) {
        result.push({
          _id: task._id,
          title: task.title,
          status: task.status,
          taskNumber: task.taskNumber,
        });
      }
    }
    return result;
  },
});

export const isBlocked = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
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

export const add = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    dependsOnId: v.id("agentTasks"),
  },
  returns: v.id("taskDependencies"),
  handler: async (ctx, args) => {
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

export const remove = authMutation({
  args: { id: v.id("taskDependencies") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const dep = await ctx.db.get(args.id);
    if (!dep) {
      throw new Error("Dependency not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const removeByTasks = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    dependsOnId: v.id("agentTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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
