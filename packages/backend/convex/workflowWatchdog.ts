import { v } from "convex/values";
import { type MutationCtx, internalMutation } from "./_generated/server";
import { type WorkflowId } from "@convex-dev/workflow";
import type { Id } from "./_generated/dataModel";
import { workflow } from "./workflowManager";
import { clearStreamingActivity } from "./_taskWorkflow/helpers";
import {
  getProjectConversation,
  setProjectConversation,
} from "./_projects/helpers";

export const RUN_TIMEOUT_MS = 2 * 60 * 60 * 1000;

async function cancelStaleWorkflow(
  ctx: MutationCtx,
  workflowId: string,
  streamingEntityIds: string[],
): Promise<void> {
  try {
    await workflow.cancel(ctx, workflowId as WorkflowId);
  } catch {}
  for (const entityId of streamingEntityIds) {
    await clearStreamingActivity(ctx, entityId);
  }
}

async function timeoutLastMessage(
  ctx: MutationCtx,
  parentId: Id<"sessions"> | Id<"designSessions"> | Id<"researchQueries">,
  content: string,
): Promise<void> {
  const last = await ctx.db
    .query("messages")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .order("desc")
    .first();
  if (last && last.role === "assistant" && !last.content) {
    await ctx.db.patch(last._id, { content });
  }
}

export const handleStaleSession = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.activeWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [
      String(args.sessionId),
      `summary:${String(args.sessionId)}`,
    ]);

    await timeoutLastMessage(ctx, args.sessionId, "Execution timed out.");

    await ctx.db.patch(args.sessionId, {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const handleStaleDesignSession = internalMutation({
  args: {
    designSessionId: v.id("designSessions"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session || session.activeWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [
      String(args.designSessionId),
    ]);

    await timeoutLastMessage(
      ctx,
      args.designSessionId,
      "Error: Design generation timed out.",
    );

    await ctx.db.patch(args.designSessionId, {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const handleStaleResearchQuery = internalMutation({
  args: {
    queryId: v.id("researchQueries"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rq = await ctx.db.get(args.queryId);
    if (!rq || rq.activeWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [String(args.queryId)]);

    await timeoutLastMessage(ctx, args.queryId, "Query execution timed out.");

    await ctx.db.patch(args.queryId, {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const handleStaleEvaluation = internalMutation({
  args: {
    reportId: v.id("evaluationReports"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report || report.activeWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [String(args.reportId)]);

    await ctx.db.patch(args.reportId, {
      status: "error",
      error: "Evaluation timed out",
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const handleStaleDoc = internalMutation({
  args: {
    docId: v.id("docs"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || doc.activeWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [String(args.docId)]);

    const patch: Record<
      string,
      undefined | string | typeof doc.interviewHistory
    > = { activeWorkflowId: undefined };

    if (doc.testGenStatus === "running") {
      patch.testGenStatus = "error";
    }

    if (doc.interviewHistory && doc.interviewHistory.length > 0) {
      const history = [...doc.interviewHistory];
      const last = history[history.length - 1];
      if (last && last.role === "assistant" && !last.content) {
        last.content = JSON.stringify({ error: true });
      }
      patch.interviewHistory = history;
    }

    await ctx.db.patch(args.docId, patch);

    return null;
  },
});

export const handleStaleProject = internalMutation({
  args: {
    projectId: v.id("projects"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.activeWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [String(args.projectId)]);

    const conversation = await getProjectConversation(ctx.db, args.projectId);
    const messages = [...conversation];
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant" && !last.content) {
      last.content = JSON.stringify({ error: true });
    }

    await setProjectConversation(ctx.db, args.projectId, messages);
    await ctx.db.patch(args.projectId, {
      activeWorkflowId: undefined,
      lastSandboxActivity: Date.now(),
    });

    return null;
  },
});

export const handleStaleAudit = internalMutation({
  args: {
    auditId: v.id("audits"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit || audit.status !== "running") return null;

    await ctx.db.patch(args.auditId, {
      status: "error",
      error: "Audit timed out",
    });

    return null;
  },
});

export const handleStaleBuild = internalMutation({
  args: {
    projectId: v.id("projects"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.activeBuildWorkflowId !== args.workflowId)
      return null;

    try {
      await workflow.cancel(ctx, args.workflowId as WorkflowId);
    } catch {}

    await ctx.db.patch(args.projectId, {
      activeBuildWorkflowId: undefined,
    });

    return null;
  },
});
