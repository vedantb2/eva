import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { evaluationStatusValidator, evalResultValidator } from "./validators";
import { authQuery, authMutation } from "./functions";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";

export const getBySession = authQuery({
  args: { sessionId: v.id("sessions") },
  returns: v.union(
    v.object({
      _id: v.id("sessionAudits"),
      _creationTime: v.number(),
      sessionId: v.id("sessions"),
      status: evaluationStatusValidator,
      accessibility: v.array(evalResultValidator),
      testing: v.array(evalResultValidator),
      codeReview: v.array(evalResultValidator),
      summary: v.optional(v.string()),
      error: v.optional(v.string()),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const audits = await ctx.db
      .query("sessionAudits")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    if (audits.length === 0) return null;
    return audits.sort((a, b) => b.createdAt - a.createdAt)[0];
  },
});

export const startAudit = authMutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.id("sessionAudits"),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!session.sandboxId) throw new Error("No sandbox available");

    const auditId = await ctx.db.insert("sessionAudits", {
      sessionId: args.sessionId,
      status: "running",
      accessibility: [],
      testing: [],
      codeReview: [],
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
      internal.workflowWatchdog.handleStaleSessionAudit,
      { auditId },
    );

    return auditId;
  },
});

function extractJsonBlock(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch && codeBlockMatch[1]) return codeBlockMatch[1].trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}

export const handleCompletion = authMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    costUsd: v.optional(v.number()),
    model: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audits = await ctx.db
      .query("sessionAudits")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    const audit = audits.find((a) => a.status === "running");
    if (!audit) return null;

    if (!args.success || !args.result) {
      await ctx.db.patch(audit._id, {
        status: "error" as const,
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

      await ctx.db.patch(audit._id, {
        status: "completed" as const,
        accessibility: parsed.accessibility || [],
        testing: parsed.testing || [],
        codeReview: parsed.codeReview || [],
        summary: parsed.summary || "Audit completed",
      });
    } catch {
      await ctx.db.patch(audit._id, {
        status: "error" as const,
        error: "Failed to parse audit JSON",
      });
    }

    if (args.costUsd !== undefined && args.costUsd > 0) {
      const session = await ctx.db.get(args.sessionId);
      if (session) {
        await ctx.db.insert("costLogs", {
          entityType: "sessionAudit",
          entityId: String(args.sessionId),
          entityTitle: `Audit: ${session.title}`,
          costUsd: args.costUsd,
          model: args.model ?? "haiku",
          repoId: session.repoId,
          createdAt: Date.now(),
        });
      }
    }

    return null;
  },
});

export const fail = internalMutation({
  args: {
    id: v.id("sessionAudits"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.id);
    if (!audit) return null;
    await ctx.db.patch(args.id, {
      status: "error" as const,
      error: args.error,
    });
    return null;
  },
});
