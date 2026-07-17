import { v } from "convex/values";
import { internalMutation, type MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { DEFAULT_AI_MODEL, normalizeAIModel } from "../validators";
import { authMutation, hasRepoAccess } from "../functions";
import { workflow } from "../workflowManager";
import { buildAutomationRunBranchName } from "./helpers";

/**
 * Inserts a queued automation run and starts its execution workflow.
 * Shared by the cron trigger and the manual "run now" path — both enqueue an
 * identical run once their eligibility checks pass.
 */
async function startAutomationRun(
  ctx: MutationCtx,
  automation: Doc<"automations">,
  repo: Doc<"githubRepos">,
): Promise<void> {
  const runId = await ctx.db.insert("automationRuns", {
    automationId: automation._id,
    repoId: automation.repoId,
    status: "queued",
    startedAt: Date.now(),
    acknowledged: false,
  });

  const branchName = buildAutomationRunBranchName(automation._id, runId);

  const workflowId = await workflow.start(
    ctx,
    internal.automationWorkflow.automationExecutionWorkflow,
    {
      runId,
      automationId: automation._id,
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
}

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

    await startAutomationRun(ctx, automation, repo);

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

    await startAutomationRun(ctx, automation, repo);

    return null;
  },
});
