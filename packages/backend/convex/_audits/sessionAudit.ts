import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { authMutation } from "../functions";
import { RUN_TIMEOUT_MS } from "../workflowWatchdog";
import {
  extractJsonBlock,
  recordCompletionLog,
} from "../_taskWorkflow/helpers";
import {
  parseSectionsFromJson,
  extractSummaryFromJson,
} from "../_taskWorkflow/auditParser";

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
      await recordCompletionLog(ctx, {
        entityType: "sessionAudit",
        entityId: String(args.sessionId),
        entityTitle: `Audit: ${session.title}`,
        repoId: session.repoId,
        rawResultEvent: args.rawResultEvent,
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
