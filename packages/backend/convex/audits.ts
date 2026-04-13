import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
  evaluationStatusValidator,
  auditSectionValidator,
  evalFixStatusValidator,
  activityLogTypeValidator,
  auditSeverityValidator,
} from "./validators";
import { authQuery, authMutation, hasTaskAccess } from "./functions";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { extractJsonBlock } from "./_taskWorkflow/helpers";
import {
  parseSectionsFromJson,
  extractSummaryFromJson,
} from "./_taskWorkflow/auditParser";

const auditReturnValidator = v.object({
  _id: v.id("audits"),
  _creationTime: v.number(),
  entityId: v.union(v.id("agentTasks"), v.id("sessions")),
  runId: v.optional(v.id("agentRuns")),
  status: evaluationStatusValidator,
  sections: v.array(auditSectionValidator),
  summary: v.optional(v.string()),
  error: v.optional(v.string()),
  fixStatus: v.optional(evalFixStatusValidator),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
  fixCompletedAt: v.optional(v.number()),
});

/** Lists all audits for a task, sorted by most recent first. */
export const listByTask = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(auditReturnValidator),
  handler: async (ctx, args) => {
    const audits = await ctx.db
      .query("audits")
      .withIndex("by_entity", (q) => q.eq("entityId", args.taskId))
      .collect();

    return audits
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((audit) => ({
        _id: audit._id,
        _creationTime: audit._creationTime,
        entityId: audit.entityId,
        runId: audit.runId,
        status: audit.status,
        sections: audit.sections ?? [],
        summary: audit.summary,
        error: audit.error,
        fixStatus: audit.fixStatus,
        createdAt: audit.createdAt,
        completedAt: audit.completedAt,
        fixCompletedAt: audit.fixCompletedAt,
      }));
  },
});

/** Retrieves the activity log for a specific run by type (run, audit, auditFix). */
export const getActivityLog = authQuery({
  args: {
    runId: v.id("agentRuns"),
    type: activityLogTypeValidator,
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) return null;
    const task = await ctx.db.get(run.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return null;

    const log = await ctx.db
      .query("agentRunActivityLogs")
      .withIndex("by_run_and_type", (q) =>
        q.eq("runId", args.runId).eq("type", args.type),
      )
      .first();
    return log?.activityLog ?? null;
  },
});

/** Returns the most recent audit for a session. */
export const getBySession = authQuery({
  args: { sessionId: v.id("sessions") },
  returns: v.union(auditReturnValidator, v.null()),
  handler: async (ctx, args) => {
    const latest = await ctx.db
      .query("audits")
      .withIndex("by_entity_created", (q) => q.eq("entityId", args.sessionId))
      .order("desc")
      .first();

    if (!latest) return null;

    return {
      _id: latest._id,
      _creationTime: latest._creationTime,
      entityId: latest.entityId,
      runId: latest.runId,
      status: latest.status,
      sections: latest.sections ?? [],
      summary: latest.summary,
      error: latest.error,
      fixStatus: latest.fixStatus,
      createdAt: latest.createdAt,
      completedAt: latest.completedAt,
      fixCompletedAt: latest.fixCompletedAt,
    };
  },
});

/** Creates a new audit record and kicks off the session audit process in a sandbox. */
export const startSessionAudit = authMutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.id("audits"),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!session.sandboxId) throw new Error("No sandbox available");

    const auditId = await ctx.db.insert("audits", {
      entityId: args.sessionId,
      status: "running",
      sections: [],
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.daytona.runSessionAudit, {
      sessionId: args.sessionId,
      sandboxId: session.sandboxId,
      auditId,
      userId: ctx.userId,
    });

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.workflowWatchdog.handleStaleAudit,
      { auditId },
    );

    return auditId;
  },
});

/** Processes the completion of a session audit, parsing results and logging. */
export const handleSessionCompletion = authMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audits = await ctx.db
      .query("audits")
      .withIndex("by_entity", (q) => q.eq("entityId", args.sessionId))
      .collect();
    const audit = audits.find((a) => a.status === "running");
    if (!audit) return null;

    if (!args.success || !args.result) {
      await ctx.db.patch(audit._id, {
        status: "error",
        error: args.error ?? "Audit failed",
        completedAt: Date.now(),
      });
      return null;
    }

    try {
      const jsonStr = extractJsonBlock(args.result);
      const raw: unknown = JSON.parse(jsonStr);

      await ctx.db.patch(audit._id, {
        status: "completed",
        sections: parseSectionsFromJson(raw),
        summary: extractSummaryFromJson(raw),
        completedAt: Date.now(),
      });
    } catch {
      await ctx.db.patch(audit._id, {
        status: "error",
        error: "Failed to parse audit JSON",
        completedAt: Date.now(),
      });
    }

    const session = await ctx.db.get(args.sessionId);
    if (session) {
      await ctx.db.insert("logs", {
        entityType: "sessionAudit",
        entityId: String(args.sessionId),
        entityTitle: `Audit: ${session.title}`,
        rawResultEvent: args.rawResultEvent,
        repoId: session.repoId,
        createdAt: Date.now(),
      });

      if (session.prUrl && session.branchName) {
        const repo = await ctx.db.get(session.repoId);
        if (repo) {
          await ctx.scheduler.runAfter(
            0,
            internal.taskWorkflowActions.appendAuditToPullRequest,
            {
              installationId: repo.installationId,
              repoOwner: repo.owner,
              repoName: repo.name,
              branchName: session.branchName,
              auditResult: args.result,
              auditError: args.error,
            },
          );
        }
      }
    }

    return null;
  },
});

/** Marks an audit as failed with an error message (internal use). */
export const fail = internalMutation({
  args: {
    id: v.id("audits"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.id);
    if (!audit) return null;
    await ctx.db.patch(args.id, {
      status: "error",
      error: args.error,
      completedAt: Date.now(),
    });
    return null;
  },
});

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

    const branchName = `eva/task-${String(taskId)}`;

    await ctx.scheduler.runAfter(0, internal.daytona.launchSelectedAuditFixes, {
      auditId: args.auditId,
      selectedFailures: args.selectedFailures,
      sandboxId: run.sandboxId,
      taskId: String(taskId),
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
