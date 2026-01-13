import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getRunInternal = internalQuery({
  args: { id: v.id("agentRuns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getTaskInternal = internalQuery({
  args: { id: v.id("agentTasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getRepoInternal = internalQuery({
  args: { id: v.id("githubRepos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateRunStatusInternal = internalMutation({
  args: {
    id: v.id("agentRuns"),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("success"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) throw new Error("Run not found");
    await ctx.db.patch(args.id, { status: args.status });
    if (args.status === "running") {
      const task = await ctx.db.get(run.taskId);
      if (task) {
        await ctx.db.patch(task._id, {
          status: "in_progress",
          updatedAt: Date.now(),
        });
      }
    }
  },
});

export const trigger = internalAction({
  args: { runId: v.id("agentRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.runQuery(internal.agentExecution.getRunInternal, {
      id: args.runId,
    });
    if (!run) throw new Error("Run not found");

    const task = await ctx.runQuery(internal.agentExecution.getTaskInternal, {
      id: run.taskId,
    });
    if (!task) throw new Error("Task not found");

    if (!task.repoId) throw new Error("Task has no associated repo");

    const repo = await ctx.runQuery(internal.agentExecution.getRepoInternal, {
      id: task.repoId,
    });
    if (!repo) throw new Error("Repo not found");

    const appUrl = process.env.SITE_URL;
    if (!appUrl) throw new Error("SITE_URL not configured");

    const tokenResponse = await fetch(
      `${appUrl}/api/github/installation-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installationId: repo.installationId }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error(
        `Failed to get installation token: ${tokenResponse.statusText}`
      );
    }

    const { token } = await tokenResponse.json();

    await ctx.runMutation(internal.agentExecution.updateRunStatusInternal, {
      id: args.runId,
      status: "running",
    });

    const executeResponse = await fetch(`${appUrl}/api/execute-task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId: args.runId,
        taskId: run.taskId,
        repoId: task.repoId,
        githubToken: token,
      }),
    });

    if (!executeResponse.ok) {
      throw new Error(
        `Failed to trigger execution: ${executeResponse.statusText}`
      );
    }
  },
});
