import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { DEFAULT_AI_MODEL, normalizeAIModel } from "../validators";
import { authMutation, hasRepoAccess } from "../functions";
import { workflow } from "../workflowManager";

/** Called by the cron scheduler to trigger an automation run if eligible. */
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
        model: normalizeAIModel(
          automation.model ?? repo.defaultModel ?? DEFAULT_AI_MODEL,
        ),
        rootDirectory: repo.rootDirectory ?? "",
        userId: automation.createdBy,
        readOnly: automation.readOnly === true,
        actionsEnabled: automation.actionsEnabled === true,
      },
    );

    await ctx.db.patch(runId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});

/** Frontend trigger to immediately run an automation outside its cron schedule. */
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
        model: normalizeAIModel(
          automation.model ?? repo.defaultModel ?? DEFAULT_AI_MODEL,
        ),
        rootDirectory: repo.rootDirectory ?? "",
        userId: automation.createdBy,
        readOnly: automation.readOnly === true,
        actionsEnabled: automation.actionsEnabled === true,
      },
    );

    await ctx.db.patch(runId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});
