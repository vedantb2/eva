import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  internalAction,
} from "../_generated/server";
import { internal } from "../_generated/api";
import {
  clearStreamingActivity,
  extractJsonBlock,
  getTaskAuditStreamingEntityId,
  resolveTaskBranchName,
  resolveTaskSandboxIdForRun,
  upsertActivityLog,
  upsertStreamingActivity,
} from "./helpers";
import { parseSectionsFromJson, extractSummaryFromJson } from "./auditParser";

/** Creates a new audit record for a task run and sets initial streaming activity. */
export const createAudit = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.id("audits"),
  handler: async (ctx, args) => {
    const auditId = await ctx.db.insert("audits", {
      entityId: args.taskId,
      runId: args.runId,
      status: "running",
      sections: [],
      createdAt: Date.now(),
    });

    await upsertStreamingActivity(
      ctx,
      getTaskAuditStreamingEntityId(args.runId),
      JSON.stringify([
        {
          type: "thinking",
          label: "Starting audit...",
          status: "active",
        },
      ]),
    );

    return auditId;
  },
});

/** Saves the parsed audit result or records an error, then cleans up streaming state. */
export const saveAuditResult = internalMutation({
  args: {
    auditId: v.id("audits"),
    result: v.union(v.string(), v.null()),
    error: v.optional(v.string()),
    activityLog: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      return null;
    }

    const runId = audit.runId;
    /** Clears streaming activity records for this audit run. */
    const clearAuditStreaming = async (): Promise<void> => {
      if (runId) {
        await clearStreamingActivity(ctx, getTaskAuditStreamingEntityId(runId));
      }
      await clearStreamingActivity(ctx, `audit-${String(audit.entityId)}`);
    };

    if (args.error || !args.result) {
      await ctx.db.patch(args.auditId, {
        status: "error",
        error: args.error ?? "Audit failed",
        completedAt: Date.now(),
      });
    } else {
      try {
        const jsonStr = extractJsonBlock(args.result);
        const raw: unknown = JSON.parse(jsonStr);

        await ctx.db.patch(args.auditId, {
          status: "completed",
          sections: parseSectionsFromJson(raw),
          summary: extractSummaryFromJson(raw),
          completedAt: Date.now(),
        });
      } catch {
        await ctx.db.patch(args.auditId, {
          status: "error",
          error: "Failed to parse audit JSON",
          completedAt: Date.now(),
        });
      }
    }

    if (runId && args.activityLog) {
      await upsertActivityLog(ctx, runId, args.activityLog, "audit");
    }

    await clearAuditStreaming();
    return null;
  },
});

/** Updates the fix status on an audit record and persists the fix activity log. */
export const setFixStatus = internalMutation({
  args: {
    auditId: v.id("audits"),
    fixStatus: v.union(
      v.literal("fixing"),
      v.literal("fix_completed"),
      v.literal("fix_error"),
    ),
    activityLog: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) return null;

    const patchData: {
      fixStatus: typeof args.fixStatus;
      fixCompletedAt?: number;
    } = {
      fixStatus: args.fixStatus,
    };
    if (args.fixStatus === "fix_completed" || args.fixStatus === "fix_error") {
      patchData.fixCompletedAt = Date.now();
    }
    await ctx.db.patch(args.auditId, patchData);

    if (audit.runId && args.activityLog) {
      await upsertActivityLog(ctx, audit.runId, args.activityLog, "fix");
    }
    return null;
  },
});

export const getAuditFixPushData = internalQuery({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.union(
    v.null(),
    v.object({
      sandboxId: v.string(),
      installationId: v.number(),
      repoOwner: v.string(),
      repoName: v.string(),
      repoId: v.id("githubRepos"),
      branchName: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task?.repoId) return null;

    const run = await ctx.db.get(args.runId);
    if (!run || run.taskId !== args.taskId) return null;

    const repo = await ctx.db.get(task.repoId);
    if (!repo) return null;

    const sandboxId = await resolveTaskSandboxIdForRun(ctx.db, task, run);
    if (!sandboxId) return null;

    return {
      sandboxId,
      installationId: repo.installationId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: task.repoId,
      branchName: await resolveTaskBranchName(ctx.db, task),
    };
  },
});

export const publishAuditFixBranch = internalAction({
  args: {
    auditId: v.id("audits"),
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const pushData = await ctx.runQuery(
      internal.taskWorkflow.getAuditFixPushData,
      {
        taskId: args.taskId,
        runId: args.runId,
      },
    );

    if (!pushData) {
      console.error(
        `[audit-fix] publish skipped — missing push data taskId=${String(args.taskId)} runId=${String(args.runId)}`,
      );
      await ctx.runMutation(internal.taskWorkflow.setFixStatus, {
        auditId: args.auditId,
        fixStatus: "fix_error",
      });
      return null;
    }

    try {
      await ctx.runAction(internal.daytona.pushSandboxBranch, {
        sandboxId: pushData.sandboxId,
        installationId: pushData.installationId,
        repoOwner: pushData.repoOwner,
        repoName: pushData.repoName,
        repoId: pushData.repoId,
        branchName: pushData.branchName,
      });
      await ctx.runMutation(internal.taskWorkflow.setFixStatus, {
        auditId: args.auditId,
        fixStatus: "fix_completed",
      });
    } catch (error) {
      console.error(
        `[audit-fix] pushSandboxBranch failed auditId=${String(args.auditId)}: ${error instanceof Error ? error.message : String(error)}`,
      );
      await ctx.runMutation(internal.taskWorkflow.setFixStatus, {
        auditId: args.auditId,
        fixStatus: "fix_error",
      });
    }

    return null;
  },
});
