import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { evaluationStatusValidator, auditSectionValidator } from "./validators";
import { authQuery, authMutation } from "./functions";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { extractJsonBlock } from "./_taskWorkflow/helpers";
import {
  parseSectionsFromJson,
  extractSummaryFromJson,
} from "./_taskWorkflow/auditParser";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const auditReturnValidator = v.union(
  v.object({
    _id: v.id("audits"),
    _creationTime: v.number(),
    entityId: v.union(v.id("agentTasks"), v.id("sessions")),
    runId: v.optional(v.id("agentRuns")),
    status: evaluationStatusValidator,
    sections: v.array(auditSectionValidator),
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  }),
  v.null(),
);

async function getLatestAuditByEntityId(
  ctx: QueryCtx,
  entityId: Id<"agentTasks"> | Id<"sessions">,
) {
  const latest = await ctx.db
    .query("audits")
    .withIndex("by_entity_created", (q) => q.eq("entityId", entityId))
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
    createdAt: latest.createdAt,
  };
}

export const getByTask = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: auditReturnValidator,
  handler: async (ctx, args) => getLatestAuditByEntityId(ctx, args.taskId),
});

export const getBySession = authQuery({
  args: { sessionId: v.id("sessions") },
  returns: auditReturnValidator,
  handler: async (ctx, args) => getLatestAuditByEntityId(ctx, args.sessionId),
});

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
      });
    } catch {
      await ctx.db.patch(audit._id, {
        status: "error",
        error: "Failed to parse audit JSON",
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
    });
    return null;
  },
});
