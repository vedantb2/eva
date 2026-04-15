import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import {
  clearStreamingActivity,
  extractJsonBlock,
  getTaskAuditStreamingEntityId,
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
      if (runId && args.activityLog) {
        await upsertActivityLog(ctx, runId, args.activityLog, "audit");
      }
      await clearAuditStreaming();
      return null;
    }

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
