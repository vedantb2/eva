import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { LlmJson } from "@solvers-hub/llm-json";
import { evalResultValidator } from "./validators";

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
    convexToken: v.string(),
    githubToken: v.string(),
    branchName: v.optional(v.string()),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Create report and set status to running
    await step.runMutation(internal.evaluationWorkflow.setRunning, {
      reportId: args.reportId,
    });

    // Step 2: Fetch doc data and build two-phase prompt
    const docData = await step.runQuery(
      internal.evaluationWorkflow.getDocData,
      { docId: args.docId },
    );

    // Step 3: Setup sandbox + fire two-phase Claude CLI
    await step.runAction(internal.daytona.setupAndExecute, {
      entityId: String(args.reportId),
      githubToken: args.githubToken,
      repoOwner: docData.repoOwner,
      repoName: docData.repoName,
      prompt: docData.prompt,
      convexToken: args.convexToken,
      completionMutation: "evaluationWorkflow:handleCompletion",
      entityIdField: "reportId",
      model: "sonnet",
      allowedTools: "Read,Glob,Grep",
      baseBranch: args.branchName,
      ephemeral: true,
      repoId: docData.repoId,
    });

    // Step 4: Wait for callback
    const result = await step.awaitEvent(evalCompleteEvent);

    // Step 5: Save results
    await step.runMutation(internal.evaluationWorkflow.saveResult, {
      reportId: args.reportId,
      success: result.success,
      result: result.result,
      error: result.error,
    });
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

    const requirements = doc.requirements ?? [];

    // Two-phase prompt: first explore the codebase, then generate evaluation JSON
    const prompt = `You are a QA engineer evaluating whether a codebase meets a specification.

## Phase 1: Explore the Codebase

## Feature: ${doc.title}
${doc.description || ""}

## Requirements to verify:
${requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

For each requirement above, explore the codebase to find evidence of whether it is implemented.
Search for relevant files, read implementations, and note what you find.
Be thorough — check routes, components, API handlers, database schemas, and business logic.

After exploring, produce the final evaluation.

## Phase 2: Generate Evaluation

Based on your analysis, produce the final evaluation as JSON.

Requirements (evaluate exactly ${requirements.length}, one result per requirement):
${requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Rules:
- "passed": true means the requirement is fully implemented and functional
- "passed": false means it is missing, partial, or broken
- "detail": brief plain-language explanation of what you found (no file paths or code)
- You MUST produce exactly ${requirements.length} results, one per requirement, in order

Output ONLY valid JSON. No markdown, no explanation, no text outside the JSON object.

{"results": [{"requirement": "...", "passed": true, "detail": "..."}], "summary": "..."}`;

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
    // Clear streaming activity
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.reportId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

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
    convexToken: v.string(),
    githubToken: v.string(),
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
        convexToken: args.convexToken,
        githubToken: args.githubToken,
        branchName: args.branchName,
      },
    );

    await ctx.db.patch(reportId, {
      activeWorkflowId: String(workflowId),
    });

    return reportId;
  },
});
