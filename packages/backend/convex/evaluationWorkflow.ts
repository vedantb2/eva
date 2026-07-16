import { v } from "convex/values";
import { z } from "zod";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation, hasRepoAccess } from "./functions";
import { workflowCompleteValidator } from "./validators";
import { trackEvaluationWorkflow } from "./workflowWatchdog";
import {
  clearStreamingActivity,
  llmJson,
  recordCompletionLog,
  sendCompletionEvent,
} from "./_taskWorkflow/helpers";
import { buildPrBody } from "./prBody";
import { prepareSandboxSteps } from "./_daytona/prepareSandboxSteps";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";

const evalCompleteEvent = defineEvent({
  name: "evalComplete",
  validator: workflowCompleteValidator,
});

const fixCompleteEvent = defineEvent({
  name: "fixComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

// --- Workflow definition ---

/** Runs an evaluation: analyzes the codebase against doc requirements and saves pass/fail results. Fixing failures is opt-in via startFix. */
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

      const streamingEntityId = String(args.reportId);

      const { sandboxId } = await prepareSandboxSteps(step, {
        installationId: args.installationId,
        repoOwner: docData.repoOwner,
        repoName: docData.repoName,
        ephemeral: true,
        repoId: docData.repoId,
        streamingEntityId,
        baseBranch: args.branchName,
      });

      await step.runAction(internal.daytona.launchOnExistingSandbox, {
        sandboxId,
        entityId: String(args.reportId),
        prompt: docData.prompt,
        userId: args.userId,
        completionMutation: "evaluationWorkflow:handleCompletion",
        entityIdField: "reportId",
        model: "sonnet",
        allowedTools: "Read,Glob,Grep",
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

/**
 * Fixes the failing requirements of a completed evaluation: spins up a sandbox
 * with write access, lets the agent commit, then pushes the branch and opens a
 * PR. Started on demand by the startFix mutation. The fix branch name is passed
 * in (not derived inside the handler) so workflow replays stay deterministic.
 */
export const fixWorkflow = workflow.define({
  args: {
    reportId: v.id("evaluationReports"),
    docId: v.id("docs"),
    userId: v.id("users"),
    installationId: v.number(),
    baseBranch: v.optional(v.string()),
    fixBranchName: v.string(),
  },
  handler: async (step, args): Promise<void> => {
    try {
      const fixData = await step.runQuery(
        internal.evaluationWorkflow.getFixData,
        { reportId: args.reportId, docId: args.docId },
      );

      const baseBranch = args.baseBranch ?? FALLBACK_GIT_BASE_BRANCH;

      const { sandboxId: fixSandboxId } = await prepareSandboxSteps(step, {
        installationId: args.installationId,
        repoOwner: fixData.repoOwner,
        repoName: fixData.repoName,
        ephemeral: true,
        repoId: fixData.repoId,
        streamingEntityId: String(args.reportId),
        baseBranch,
        branchName: args.fixBranchName,
      });

      await step.runAction(internal.daytona.launchOnExistingSandbox, {
        sandboxId: fixSandboxId,
        entityId: String(args.reportId),
        prompt: fixData.prompt,
        userId: args.userId,
        completionMutation: "evaluationWorkflow:handleFixCompletion",
        entityIdField: "reportId",
        model: "sonnet",
        allowedTools: "Read,Write,Edit,Bash,Glob,Grep",
        repoId: fixData.repoId,
      });

      const fixResult = await step.awaitEvent(fixCompleteEvent);

      if (fixResult.success) {
        await step.runAction(internal.daytona.pushSandboxBranch, {
          sandboxId: fixSandboxId,
          installationId: args.installationId,
          repoOwner: fixData.repoOwner,
          repoName: fixData.repoName,
          repoId: fixData.repoId,
          branchName: args.fixBranchName,
        });

        const prUrl = await step.runAction(
          internal.taskWorkflowActions.createPullRequest,
          {
            installationId: args.installationId,
            repoOwner: fixData.repoOwner,
            repoName: fixData.repoName,
            branchName: args.fixBranchName,
            baseBranch,
            title: `Fix: ${fixData.docTitle}`,
            body: buildPrBody([
              {
                heading: "Fix",
                content: fixData.prDescription ?? "No description",
              },
            ]),
            labels: ["eva", "eval-fix"],
          },
        );

        await step.runMutation(internal.evaluationWorkflow.saveFixResult, {
          reportId: args.reportId,
          prUrl,
        });
      } else {
        await step.runMutation(internal.evaluationWorkflow.saveFixError, {
          reportId: args.reportId,
          error: fixResult.error ?? "Fix workflow failed",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Fix workflow failed";
      await step.runMutation(internal.evaluationWorkflow.saveWorkflowFailure, {
        reportId: args.reportId,
        error: errorMessage,
      });
      throw error;
    }
  },
});

// --- Supporting internal functions ---

/** Sets the evaluation report status to running. */
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

/** Fetches document and repo data and builds the evaluation prompt with requirements. */
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

/**
 * Schema for the LLM evaluation JSON. Per-field `.catch()` defaults fold
 * validation and fallback values into a single parse: a non-string requirement
 * or detail becomes "", `passed` is true only when strictly boolean-true, a
 * malformed item collapses to a default entry, a missing/non-array `results`
 * becomes undefined (triggering the per-requirement fallback), and a
 * non-string summary becomes "Evaluation completed".
 */
const evalJsonSchema = z
  .object({
    results: z
      .array(
        z
          .object({
            requirement: z.string().catch(""),
            passed: z.boolean().catch(false),
            detail: z.string().catch(""),
          })
          .catch({ requirement: "", passed: false, detail: "" }),
      )
      .optional()
      .catch(undefined),
    summary: z.string().catch("Evaluation completed"),
  })
  .catch({ results: undefined, summary: "Evaluation completed" });

/** Saves evaluation results, parsing the LLM JSON into per-requirement pass/fail entries. */
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
        const parsed = evalJsonSchema.parse(json[0]);

        const doc = await ctx.db.get(report.docId);
        const requirements = doc?.requirements ?? [];

        const results =
          parsed.results ??
          requirements.map((r) => ({
            requirement: r,
            passed: false,
            detail: "No evaluation produced",
          }));

        await ctx.db.patch(args.reportId, {
          status: "completed",
          results,
          summary: parsed.summary,
          activeWorkflowId: undefined,
          updatedAt: Date.now(),
        });
        return null;
      }
    }

    await ctx.db.patch(args.reportId, {
      status: "error",
      error: args.error || "Failed to parse evaluation results",
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Records a workflow-level failure, handling both eval and fix phase errors. */
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
    if (report.status === "completed") {
      if (report.fixStatus === "fixing") {
        await ctx.db.patch(args.reportId, {
          fixStatus: "fix_error",
          activeWorkflowId: undefined,
          updatedAt: Date.now(),
        });
      }
      return null;
    }
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

    await sendCompletionEvent(ctx, evalCompleteEvent, report.activeWorkflowId, {
      success: args.success,
      result: args.result,
      error: args.error,
      activityLog: args.activityLog,
    });

    await recordCompletionLog(ctx, {
      entityType: "evaluation",
      entityId: String(args.reportId),
      entityTitle: "Evaluation Report",
      repoId: report.repoId,
      rawResultEvent: args.rawResultEvent,
    });

    return null;
  },
});

/** Fetches failed evaluation results and builds the fix prompt and PR description. */
export const getFixData = internalQuery({
  args: { reportId: v.id("evaluationReports"), docId: v.id("docs") },
  returns: v.object({
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    docTitle: v.string(),
    prompt: v.string(),
    prDescription: v.string(),
  }),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Doc not found");

    const repo = await ctx.db.get(doc.repoId);
    if (!repo) throw new Error("Repository not found");

    const rootDirectory = repo.rootDirectory ?? "";
    const rootDirInstruction = rootDirectory
      ? `\nIMPORTANT: Unless the user mentions otherwise, focus your changes on the app at "${rootDirectory}".`
      : "";

    const failedResults = report.results.filter((r) => !r.passed);

    const prompt = `You are a senior software engineer. Your task is to fix failing requirements in this codebase.

## Feature: ${doc.title}
${doc.description || ""}

## Failing Requirements:
${failedResults.map((r, i) => `${i + 1}. ${r.requirement}\n   Issue: ${r.detail}`).join("\n")}

## Instructions:
1. Explore the codebase to understand the current implementation
2. Fix each failing requirement by making the necessary code changes
3. After making changes, commit your work with a clear commit message
4. Do NOT push. Eva publishes the branch after you finish successfully.
5. Make sure your changes don't break existing functionality

Rules:
- Make minimal, focused changes to fix only the failing requirements
- Follow existing code patterns and conventions
- Do not refactor unrelated code
- Do NOT run git push or gh pr commands${rootDirInstruction}`;

    const prDescription = `## Evaluation Fix

Automatically generated fix for failing requirements in **${doc.title}**.

### Issues Fixed:
${failedResults.map((r) => `- ${r.requirement}: ${r.detail}`).join("\n")}

---
*Implemented by Eva*`;

    return {
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: doc.repoId,
      docTitle: doc.title,
      prompt,
      prDescription,
    };
  },
});

/** Saves the fix result with the PR URL and marks fix as completed. */
export const saveFixResult = internalMutation({
  args: {
    reportId: v.id("evaluationReports"),
    prUrl: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.reportId));

    await ctx.db.patch(args.reportId, {
      fixStatus: "fix_completed",
      prUrl: args.prUrl ?? undefined,
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Marks the fix phase as errored and clears the active workflow. */
export const saveFixError = internalMutation({
  args: {
    reportId: v.id("evaluationReports"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.reportId));

    await ctx.db.patch(args.reportId, {
      fixStatus: "fix_error",
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Receives sandbox fix completion callback and forwards the event to the active workflow. */
export const handleFixCompletion = authMutation({
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

    await sendCompletionEvent(ctx, fixCompleteEvent, report.activeWorkflowId, {
      success: args.success,
      result: args.result,
      error: args.error,
      activityLog: args.activityLog,
    });

    await recordCompletionLog(ctx, {
      entityType: "evaluation",
      entityId: String(args.reportId),
      entityTitle: "Evaluation Fix",
      repoId: report.repoId,
      rawResultEvent: args.rawResultEvent,
    });

    return null;
  },
});

/**
 * Public mutation to start an evaluation workflow from the frontend. Idempotent
 * per doc: if an evaluation is already pending or running, returns its report id
 * instead of starting a duplicate (keeps the "test all" loop safe).
 */
export const startEvaluation = authMutation({
  args: {
    docId: v.id("docs"),
    repoId: v.id("githubRepos"),
    branchName: v.optional(v.string()),
  },
  returns: v.id("evaluationReports"),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || doc.repoId !== args.repoId) {
      throw new Error("Document not found");
    }
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Document not found");
    }
    if ((doc.requirements ?? []).length === 0) {
      throw new Error(
        "Add requirements to this document before running a test",
      );
    }

    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");

    const existing = await ctx.db
      .query("evaluationReports")
      .withIndex("by_doc", (q) => q.eq("docId", args.docId))
      .collect();
    const active = existing.find(
      (r) => r.status === "pending" || r.status === "running",
    );
    if (active) return active._id;

    const now = Date.now();
    const reportId = await ctx.db.insert("evaluationReports", {
      repoId: args.repoId,
      docId: args.docId,
      status: "pending",
      results: [],
      branchName: args.branchName,
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
        installationId: repo.installationId,
        branchName: args.branchName,
      },
    );

    await trackEvaluationWorkflow(ctx, reportId, workflowId);

    return reportId;
  },
});

/**
 * Public mutation to start an opt-in fix for a completed evaluation that has
 * failing requirements. Idempotent: returns without starting if a fix is already
 * running or has completed. Retrying after a fix error uses a fresh branch name.
 */
export const startFix = authMutation({
  args: { reportId: v.id("evaluationReports") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");
    if (!(await hasRepoAccess(ctx.db, report.repoId, ctx.userId))) {
      throw new Error("Report not found");
    }
    if (report.activeWorkflowId !== undefined) return null;
    if (report.status !== "completed") {
      throw new Error("Evaluation is not complete");
    }
    if (!report.results.some((r) => !r.passed)) {
      throw new Error("No failing requirements to fix");
    }
    if (report.fixStatus === "fixing" || report.fixStatus === "fix_completed") {
      return null;
    }

    const repo = await ctx.db.get(report.repoId);
    if (!repo) throw new Error("Repository not found");

    // Retries need a unique branch — the previous push is not forced, so reusing
    // the name would fail if the prior attempt already pushed.
    const base = `eva/eval-fix-${String(args.reportId).slice(-8)}`;
    const fixBranchName = report.fixBranchName
      ? `${base}-r${Date.now().toString(36)}`
      : base;

    await ctx.db.patch(args.reportId, {
      fixStatus: "fixing",
      fixBranchName,
      updatedAt: Date.now(),
    });

    const workflowId = await workflow.start(
      ctx,
      internal.evaluationWorkflow.fixWorkflow,
      {
        reportId: args.reportId,
        docId: report.docId,
        userId: ctx.userId,
        installationId: repo.installationId,
        baseBranch: report.branchName,
        fixBranchName,
      },
    );

    await trackEvaluationWorkflow(ctx, args.reportId, workflowId);

    return null;
  },
});
