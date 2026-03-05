import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { extractJsonBlock } from "./helpers";

export const createAudit = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.id("taskAudits"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("taskAudits", {
      taskId: args.taskId,
      runId: args.runId,
      status: "running",
      accessibility: [],
      testing: [],
      codeReview: [],
      createdAt: Date.now(),
    });
  },
});

export const saveAuditResult = internalMutation({
  args: {
    auditId: v.id("taskAudits"),
    result: v.union(v.string(), v.null()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.error || !args.result) {
      await ctx.db.patch(args.auditId, {
        status: "error",
        error: args.error ?? "Audit failed",
      });
      return null;
    }

    try {
      const jsonStr = extractJsonBlock(args.result);
      const parsed: {
        accessibility: Array<{
          requirement: string;
          passed: boolean;
          detail: string;
        }>;
        testing: Array<{
          requirement: string;
          passed: boolean;
          detail: string;
        }>;
        codeReview: Array<{
          requirement: string;
          passed: boolean;
          detail: string;
        }>;
        summary: string;
      } = JSON.parse(jsonStr);

      await ctx.db.patch(args.auditId, {
        status: "completed",
        accessibility: parsed.accessibility || [],
        testing: parsed.testing || [],
        codeReview: parsed.codeReview || [],
        summary: parsed.summary || "Audit completed",
      });
    } catch {
      await ctx.db.patch(args.auditId, {
        status: "error",
        error: "Failed to parse audit JSON",
      });
    }

    return null;
  },
});
