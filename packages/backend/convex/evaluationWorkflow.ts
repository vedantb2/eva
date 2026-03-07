import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { LlmJson } from "@solvers-hub/llm-json";
import { evalResultValidator } from "./validators";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { clearStreamingActivity } from "./_taskWorkflow/helpers";

const llmJson = new LlmJson({ attemptCorrection: true });

const evalCompleteEvent = defineEvent({
  name: "evalComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

// --- Workflow definition ---

export const evaluationWorkflow = workflow.define({
  args: {
    reportId: v.id("evaluationReports"),
    docId: v.id("docs"),
    userId: v.id("users"),
    installationId: v.number(),
    branchName: v.optional(v.string()),
  },
  handler: async (step, args): Promise<void> => {
    try {
      await step.runMutation(internal.evaluationWorkflow.setRunning, {
        reportId: args.reportId,
      });

      const docData = await step.runQuery(
        internal.evaluationWorkflow.getDocData,
        { docId: args.docId },
      );

      await step.runAction(internal.daytona.setupAndExecute, {
        entityId: String(args.reportId),
        installationId: args.installationId,
        repoOwner: docData.repoOwner,
        repoName: docData.repoName,
        prompt: docData.prompt,
        userId: args.userId,
        completionMutation: "evaluationWorkflow:handleCompletion",
        entityIdField: "reportId",
        model: "sonnet",
        allowedTools: "Read,Glob,Grep",
        baseBranch: args.branchName,
        ephemeral: true,
        repoId: docData.repoId,
      });

      const result = await step.awaitEvent(evalCompleteEvent);

      await step.runMutation(internal.evaluationWorkflow.saveResult, {
        reportId: args.reportId,
        success: result.success,
        result: result.result,
        error: result.error,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Evaluation workflow failed";
      await step.runMutation(internal.evaluationWorkflow.saveWorkflowFailure, {
        reportId: args.reportId,
        error: errorMessage,
      });
      throw error;
    }
  },
});

// --- Supporting internal functions ---

export const setRunning = internalMutation({
  args: { reportId: v.id("evaluationReports") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      status: "running",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const getDocData = internalQuery({
  args: { docId: v.id("docs") },
  returns: v.object({
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    prompt: v.string(),
  }),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Doc not found");

    const repo = await ctx.db.get(doc.repoId);
    if (!repo) throw new Error("Repository not found");

    const rootDirectory = repo.rootDirectory ?? "";
    const rootDirInstruction = rootDirectory
      ? `\nIMPORTANT: Unless the user mentions otherwise, focus your evaluation on the app at "${rootDirectory}".`
      : "";

    const requirements = doc.requirements ?? [];

    // Two-phase prompt: first explore the codebase, then generate evaluation JSON
    const prompt = `You are a QA engineer evaluating whether a codebase meets a specification.

## Feature: ${doc.title}
${doc.description || ""}

## Requirements to verify:
${requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

## Phase 1: Explore
For each requirement, search the codebase for evidence of implementation. Check routes, components, API handlers, schemas, and business logic.

## Phase 2: Evaluate
Based on your analysis, output ONLY valid JSON:
{"results": [{"requirement": "...", "passed": true, "detail": "..."}], "summary": "..."}

Rules:
- "passed": true = fully implemented and functional; false = missing, partial, or broken
- "detail": brief plain-language explanation (no file paths or code)
- Exactly ${requirements.length} results, one per requirement, in order

No markdown, no explanation, no text outside the JSON.${rootDirInstruction}`;

    return {
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: doc.repoId,
      prompt,
    };
  },
});

export const saveResult = internalMutation({
  args: {
    reportId: v.id("evaluationReports"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.reportId));

    const report = await ctx.db.get(args.reportId);
    if (!report) return null;

    if (args.success && args.result) {
      const { json } = llmJson.extract(args.result);
      if (json.length > 0) {
        const parsed = json[0] as {
          results?: Array<{
            requirement?: string;
            passed?: boolean;
            detail?: string;
          }>;
          summary?: string;
        };

        // Fetch doc to get the original requirements for fallback
        const doc = await ctx.db.get(report.docId);
        const requirements = doc?.requirements ?? [];

        const results = Array.isArray(parsed.results)
          ? parsed.results.map((item) => ({
              requirement:
                typeof item.requirement === "string" ? item.requirement : "",
              passed: item.passed === true,
              detail: typeof item.detail === "string" ? item.detail : "",
            }))
          : requirements.map((r) => ({
              requirement: r,
              passed: false,
              detail: "No evaluation produced",
            }));

        await ctx.db.patch(args.reportId, {
          status: "completed",
          results,
          summary:
            typeof parsed.summary === "string"
              ? parsed.summary
              : "Evaluation completed",
          activeWorkflowId: undefined,
          updatedAt: Date.now(),
        });
        return null;
      }
    }

    // On failure
    await ctx.db.patch(args.reportId, {
      status: "error",
      error: args.error || "Failed to parse evaluation results",
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const saveWorkflowFailure = internalMutation({
  args: {
    reportId: v.id("evaluationReports"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.reportId));

    const report = await ctx.db.get(args.reportId);
    if (!report) return null;
    if (report.status === "completed") return null;
    if (report.status === "error" && report.activeWorkflowId === undefined) {
      return null;
    }

    await ctx.db.patch(args.reportId, {
      status: "error",
      error: args.error,
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Called by the sandbox via Convex HTTP API (authenticated with Clerk JWT).
 */
export const handleCompletion = authMutation({
  args: {
    reportId: v.id("evaluationReports"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report || !report.activeWorkflowId) return null;

    await workflow.sendEvent(ctx, {
      ...evalCompleteEvent,
      workflowId: report.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    await ctx.db.insert("logs", {
      entityType: "evaluation",
      entityId: String(args.reportId),
      entityTitle: "Evaluation Report",
      rawResultEvent: args.rawResultEvent,
      repoId: report.repoId,
      createdAt: Date.now(),
    });

    return null;
  },
});

/**
 * Public mutation to start an evaluation workflow from the frontend.
 */
export const startEvaluation = authMutation({
  args: {
    docId: v.id("docs"),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    branchName: v.optional(v.string()),
  },
  returns: v.id("evaluationReports"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const reportId = await ctx.db.insert("evaluationReports", {
      repoId: args.repoId,
      docId: args.docId,
      status: "pending",
      results: [],
      createdAt: now,
      updatedAt: now,
    });

    const workflowId = await workflow.start(
      ctx,
      internal.evaluationWorkflow.evaluationWorkflow,
      {
        reportId,
        docId: args.docId,
        userId: ctx.userId,
        installationId: args.installationId,
        branchName: args.branchName,
      },
    );

    const report = await ctx.db.get(reportId);
    if (
      report &&
      report.status !== "error" &&
      report.activeWorkflowId === undefined
    ) {
      await ctx.db.patch(reportId, {
        activeWorkflowId: String(workflowId),
      });
    }

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.workflowWatchdog.handleStaleEvaluation,
      { reportId, workflowId: String(workflowId) },
    );

    return reportId;
  },
});
