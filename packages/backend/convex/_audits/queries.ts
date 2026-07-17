import { v } from "convex/values";
import {
  evaluationStatusValidator,
  auditSectionValidator,
  evalFixStatusValidator,
  activityLogTypeValidator,
} from "../validators";
import { authQuery, hasTaskAccess } from "../functions";
import type { Doc } from "../_generated/dataModel";

export const auditReturnValidator = v.object({
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

/** Maps an audit document to the public return shape. */
function toAuditReturn(audit: Doc<"audits">) {
  return {
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
  };
}

/** Lists all audits for a task, sorted by most recent first. */
export const listByTask = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(auditReturnValidator),
  handler: async (ctx, args) => {
    const audits = await ctx.db
      .query("audits")
      .withIndex("by_entity", (q) => q.eq("entityId", args.taskId))
      .collect();

    return audits.sort((a, b) => b.createdAt - a.createdAt).map(toAuditReturn);
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

    return toAuditReturn(latest);
  },
});
