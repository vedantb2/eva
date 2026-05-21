import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { auditSeverityValidator } from "../validators";
import { authMutation, hasTaskAccess } from "../functions";
import { resolveTaskBranchName } from "../_taskWorkflow/helpers";

const auditFailureValidator = v.object({
  section: v.string(),
  requirement: v.string(),
  detail: v.string(),
  severity: auditSeverityValidator,
});

/** Triggers fixes for selected audit failures in the sandbox. */
export const runSelectedFixes = authMutation({
  args: {
    auditId: v.id("audits"),
    selectedFailures: v.array(auditFailureValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.selectedFailures.length === 0) {
      throw new Error("No failures selected");
    }

    const audit = await ctx.db.get(args.auditId);
    if (!audit) throw new Error("Audit not found");
    if (audit.status !== "completed") throw new Error("Audit not completed");
    if (audit.fixStatus === "fixing")
      throw new Error("Fix already in progress");

    const runId = audit.runId;
    if (!runId) throw new Error("Audit has no associated run");

    const run = await ctx.db.get(runId);
    if (!run) throw new Error("Run not found");

    const task = await ctx.db.get(run.taskId);
    if (!task) throw new Error("Task not found");

    if (!(await hasTaskAccess(ctx.db, task, ctx.userId))) {
      throw new Error("Not authorized");
    }

    const taskId = task._id;
    const repoId = task.repoId;
    if (!repoId) throw new Error("Task has no repo");

    const repo = await ctx.db.get(repoId);
    if (!repo) throw new Error("Repo not found");

    await ctx.db.patch(args.auditId, { fixStatus: "fixing" });

    const branchName = await resolveTaskBranchName(ctx.db, task);

    await ctx.scheduler.runAfter(0, internal.daytona.launchSelectedAuditFixes, {
      auditId: args.auditId,
      selectedFailures: args.selectedFailures,
      sandboxId: run.sandboxId,
      taskId,
      runId,
      userId: ctx.userId,
      repoId,
      installationId: repo.installationId,
      repoOwner: repo.owner,
      repoName: repo.name,
      branchName,
      rootDirectory: repo.rootDirectory ?? "",
    });

    return null;
  },
});

/** Persists a recovered sandbox ID after the audit-fix flow had to spin up a
 * replacement (the original task/project sandbox was unhealthy or gone).
 * Routes to the project for project tasks; otherwise to the task itself, so
 * subsequent runs and reviewer Start Sandbox reuse the same paused filesystem. */
export const saveAuditFixSandboxId = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    sandboxId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    if (task.projectId) {
      await ctx.db.patch(task.projectId, {
        sandboxId: args.sandboxId,
        lastSandboxActivity: Date.now(),
      });
    } else {
      await ctx.db.patch(args.taskId, {
        sandboxId: args.sandboxId,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});
