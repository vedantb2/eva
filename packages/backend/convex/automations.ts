import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal, components } from "./_generated/api";
import { Crons } from "@convex-dev/crons";
import {
  claudeModelValidator,
  automationFields,
  automationRunFields,
  runStatusValidator,
} from "./validators";
import { authQuery, authMutation, hasRepoAccess } from "./functions";
import { workflow } from "./workflowManager";
import type { WorkflowId } from "@convex-dev/workflow";
import type { Doc, Id } from "./_generated/dataModel";
import { taskCompleteEvent } from "./_taskWorkflow/events";

const crons = new Crons(components.crons);

export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      _id: v.id("automations"),
      _creationTime: v.number(),
      ...automationFields,
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automations")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = authQuery({
  args: { id: v.id("automations") },
  returns: v.union(
    v.object({
      _id: v.id("automations"),
      _creationTime: v.number(),
      ...automationFields,
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
  },
  returns: v.id("automations"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const now = Date.now();
    return await ctx.db.insert("automations", {
      repoId: args.repoId,
      title: args.title,
      description: "",
      cronSchedule: "",
      enabled: false,
      createdBy: ctx.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = authMutation({
  args: {
    id: v.id("automations"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    cronSchedule: v.optional(v.string()),
    model: v.optional(claudeModelValidator),
    enabled: v.optional(v.boolean()),
    readOnly: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.id);
    if (!automation) throw new Error("Automation not found");
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    const patch: Partial<Doc<"automations">> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;
    if (args.cronSchedule !== undefined) patch.cronSchedule = args.cronSchedule;
    if (args.model !== undefined) patch.model = args.model;
    if (args.enabled !== undefined) patch.enabled = args.enabled;
    if (args.readOnly !== undefined) patch.readOnly = args.readOnly;

    const newSchedule = args.cronSchedule ?? automation.cronSchedule;
    const newEnabled =
      args.enabled !== undefined ? args.enabled : automation.enabled;

    const cronName = `automation-${String(args.id)}`;
    if (automation.cronJobId) {
      try {
        await crons.delete(ctx, { name: cronName });
      } catch {
        // may already be deleted
      }
      patch.cronJobId = undefined;
    }

    if (newEnabled && newSchedule) {
      const cronId = await crons.register(
        ctx,
        { kind: "cron", cronspec: newSchedule },
        internal.automations.triggerAutomation,
        { automationId: args.id },
        cronName,
      );
      patch.cronJobId = String(cronId);
    }

    await ctx.db.patch(args.id, patch);
    return null;
  },
});

export const remove = authMutation({
  args: { id: v.id("automations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.id);
    if (!automation) return null;
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    const cronName = `automation-${String(args.id)}`;
    if (automation.cronJobId) {
      try {
        await crons.delete(ctx, { name: cronName });
      } catch {
        // may already be deleted
      }
    }

    const runs = await ctx.db
      .query("automationRuns")
      .withIndex("by_automation", (q) => q.eq("automationId", args.id))
      .collect();
    for (const run of runs) {
      await ctx.db.delete(run._id);
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

export const listRuns = authQuery({
  args: { automationId: v.id("automations") },
  returns: v.array(
    v.object({
      _id: v.id("automationRuns"),
      _creationTime: v.number(),
      ...automationRunFields,
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automationRuns")
      .withIndex("by_automation", (q) =>
        q.eq("automationId", args.automationId),
      )
      .order("desc")
      .take(50);
  },
});

export const acknowledgeRun = authMutation({
  args: { runId: v.id("automationRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Run not found");
    const automation = await ctx.db.get(run.automationId);
    if (!automation) throw new Error("Automation not found");
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.db.patch(args.runId, { acknowledged: true });
    return null;
  },
});

export const triggerAutomation = internalMutation({
  args: { automationId: v.id("automations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.automationId);
    if (!automation || !automation.enabled) return null;

    const repo = await ctx.db.get(automation.repoId);
    if (!repo) return null;

    const lastRun = await ctx.db
      .query("automationRuns")
      .withIndex("by_automation", (q) =>
        q.eq("automationId", args.automationId),
      )
      .order("desc")
      .first();

    if (
      lastRun &&
      (lastRun.status === "queued" || lastRun.status === "running")
    ) {
      return null;
    }

    const now = Date.now();
    const runId = await ctx.db.insert("automationRuns", {
      automationId: args.automationId,
      repoId: automation.repoId,
      status: "queued",
      startedAt: now,
      acknowledged: false,
    });

    const branchName = `eva/automation-${String(args.automationId)}`;

    const workflowId = await workflow.start(
      ctx,
      internal.automationWorkflow.automationExecutionWorkflow,
      {
        runId,
        automationId: args.automationId,
        repoId: automation.repoId,
        installationId: repo.installationId,
        branchName,
        description: automation.description,
        title: automation.title,
        model: automation.model ?? repo.defaultModel ?? "sonnet",
        rootDirectory: repo.rootDirectory ?? "",
        userId: automation.createdBy,
        readOnly: automation.readOnly === true,
      },
    );

    await ctx.db.patch(runId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});

export const runNow = authMutation({
  args: { automationId: v.id("automations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.automationId);
    if (!automation) throw new Error("Automation not found");
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    if (!automation.description) {
      throw new Error("Automation has no description/prompt configured");
    }

    const repo = await ctx.db.get(automation.repoId);
    if (!repo) throw new Error("Repo not found");

    const lastRun = await ctx.db
      .query("automationRuns")
      .withIndex("by_automation", (q) =>
        q.eq("automationId", args.automationId),
      )
      .order("desc")
      .first();

    if (
      lastRun &&
      (lastRun.status === "queued" || lastRun.status === "running")
    ) {
      throw new Error("A run is already in progress");
    }

    const now = Date.now();
    const runId = await ctx.db.insert("automationRuns", {
      automationId: args.automationId,
      repoId: automation.repoId,
      status: "queued",
      startedAt: now,
      acknowledged: false,
    });

    const branchName = `eva/automation-${String(args.automationId)}`;

    const workflowId = await workflow.start(
      ctx,
      internal.automationWorkflow.automationExecutionWorkflow,
      {
        runId,
        automationId: args.automationId,
        repoId: automation.repoId,
        installationId: repo.installationId,
        branchName,
        description: automation.description,
        title: automation.title,
        model: automation.model ?? repo.defaultModel ?? "sonnet",
        rootDirectory: repo.rootDirectory ?? "",
        userId: automation.createdBy,
        readOnly: automation.readOnly === true,
      },
    );

    await ctx.db.patch(runId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});

export const getAutomationData = internalQuery({
  args: { automationId: v.id("automations"), repoId: v.id("githubRepos") },
  returns: v.union(
    v.object({
      repoOwner: v.string(),
      repoName: v.string(),
      rootDirectory: v.string(),
      defaultBaseBranch: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return null;
    return {
      repoOwner: repo.owner,
      repoName: repo.name,
      rootDirectory: repo.rootDirectory ?? "",
      defaultBaseBranch: repo.defaultBaseBranch,
    };
  },
});

export const updateRunStatus = internalMutation({
  args: {
    runId: v.id("automationRuns"),
    status: runStatusValidator,
    sandboxId: v.optional(v.string()),
    error: v.optional(v.string()),
    resultSummary: v.optional(v.string()),
    prUrl: v.optional(v.string()),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Partial<Doc<"automationRuns">> = { status: args.status };
    if (args.sandboxId !== undefined) patch.sandboxId = args.sandboxId;
    if (args.error !== undefined) patch.error = args.error;
    if (args.resultSummary !== undefined)
      patch.resultSummary = args.resultSummary;
    if (args.prUrl !== undefined) patch.prUrl = args.prUrl;
    if (args.activityLog !== undefined) patch.activityLog = args.activityLog;
    if (args.status === "success" || args.status === "error") {
      patch.finishedAt = Date.now();
    }
    await ctx.db.patch(args.runId, patch);
    return null;
  },
});

export const clearRunWorkflow = internalMutation({
  args: { runId: v.id("automationRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runId, { activeWorkflowId: undefined });
    return null;
  },
});

export const cancelRun = authMutation({
  args: { runId: v.id("automationRuns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Run not found");
    const automation = await ctx.db.get(run.automationId);
    if (!automation) throw new Error("Automation not found");
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    if (run.activeWorkflowId) {
      try {
        await workflow.cancel(ctx, run.activeWorkflowId as WorkflowId);
      } catch {}
    }

    await ctx.db.patch(args.runId, {
      status: "error",
      error: "Cancelled by user",
      finishedAt: Date.now(),
      activeWorkflowId: undefined,
    });

    const streamingEntityId = `automation-run-${String(args.runId)}`;
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", streamingEntityId))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    return null;
  },
});

export const handleCompletion = authMutation({
  args: {
    automationRunId: v.id("automationRuns"),
    runId: v.optional(v.string()),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.automationRunId);
    if (!run || !run.activeWorkflowId) return null;

    await workflow.sendEvent(ctx, {
      ...taskCompleteEvent,
      workflowId: run.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    const automation = await ctx.db.get(run.automationId);
    if (automation) {
      await ctx.db.insert("logs", {
        entityType: "automation",
        entityId: String(args.automationRunId),
        entityTitle: automation.title,
        rawResultEvent: args.rawResultEvent,
        repoId: run.repoId,
        createdAt: Date.now(),
      });
    }

    return null;
  },
});
