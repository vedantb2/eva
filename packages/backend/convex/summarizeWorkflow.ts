import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { LlmJson } from "@solvers-hub/llm-json";

const llmJson = new LlmJson({ attemptCorrection: true });

const summarizeCompleteEvent = defineEvent({
  name: "summarizeComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

// --- Workflow definition ---

export const summarizeSessionWorkflow = workflow.define({
  args: {
    sessionId: v.id("sessions"),
    convexToken: v.string(),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    const sessionData = await step.runQuery(
      internal.summarizeWorkflow.getSessionData,
      { sessionId: args.sessionId },
    );

    await step.runAction(internal.daytona.setupAndExecute, {
      entityId: `summary:${args.sessionId}`,
      existingSandboxId: sessionData.sandboxId,
      installationId: args.installationId,
      repoOwner: sessionData.repoOwner,
      repoName: sessionData.repoName,
      prompt: sessionData.prompt,
      convexToken: args.convexToken,
      completionMutation: "summarizeWorkflow:handleCompletion",
      entityIdField: "sessionId",
      model: "haiku",
      allowedTools: "",
      repoId: sessionData.repoId,
      sessionPersistenceId: args.sessionId,
    });

    const result = await step.awaitEvent(summarizeCompleteEvent);

    await step.runMutation(internal.summarizeWorkflow.saveResult, {
      sessionId: args.sessionId,
      success: result.success,
      result: result.result,
      error: result.error,
    });
  },
});

// --- Supporting internal functions ---

export const getSessionData = internalQuery({
  args: { sessionId: v.id("sessions") },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    prompt: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .collect();

    const conversation = messages
      .filter((m) => m.mode !== "flag")
      .map((m) => m.content)
      .join("\n\n");

    const prompt = `Summarize what was accomplished in this coding session into 3-6 short bullet points. Focus on concrete outcomes: features built, bugs fixed, files changed, decisions made. Be direct and specific.

Session log:
${conversation}

Respond with ONLY a JSON array of strings, no other text. Example: ["Built login page with form validation", "Fixed auth token refresh bug"]`;

    return {
      sandboxId: session.sandboxId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: session.repoId,
      prompt,
    };
  },
});

export const saveResult = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) =>
        q.eq("entityId", `summary:${args.sessionId}`),
      )
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    let summary: string[] = ["No summary available"];

    if (args.success && args.result) {
      const { json } = llmJson.extract(args.result);
      if (json.length > 0) {
        const parsed = json[0];
        if (
          Array.isArray(parsed) &&
          parsed.every((item): item is string => typeof item === "string")
        ) {
          summary = parsed;
        }
      }
    }

    await ctx.db.patch(args.sessionId, {
      summary,
      activeWorkflowId: undefined,
    });
    return null;
  },
});

export const handleCompletion = authMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.activeWorkflowId) return null;
    if (session.userId !== ctx.userId) throw new Error("Not authorized");

    await workflow.sendEvent(ctx, {
      ...summarizeCompleteEvent,
      workflowId: session.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    return null;
  },
});

export const startSummarize = authMutation({
  args: {
    sessionId: v.id("sessions"),
    convexToken: v.string(),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.userId !== ctx.userId) throw new Error("Not authorized");

    const workflowId = await workflow.start(
      ctx,
      internal.summarizeWorkflow.summarizeSessionWorkflow,
      {
        sessionId: args.sessionId,
        convexToken: args.convexToken,
        installationId: args.installationId,
      },
    );

    await ctx.db.patch(args.sessionId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});
