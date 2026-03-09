import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { evalResultValidator, workflowCompleteValidator } from "./validators";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { clearStreamingActivity, llmJson } from "./_taskWorkflow/helpers";
import { buildPrBody } from "./taskWorkflowActions";

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

      const { sandboxId } = await step.runAction(
        internal.daytona.prepareSandbox,
        {
          installationId: args.installationId,
          repoOwner: docData.repoOwner,
          repoName: docData.repoName,
          baseBranch: args.branchName,
          ephemeral: true,
          repoId: docData.repoId,
          streamingEntityId: String(args.reportId),
        },
      );

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

      const saveResultOutput = await step.runMutation(
        internal.evaluationWorkflow.saveResult,
        {
          reportId: args.reportId,
          success: result.success,
          result: result.result,
          error: result.error,
        },
      );

      if (saveResultOutput.hasFailures) {
        const fixData = await step.runQuery(
          internal.evaluationWorkflow.getFixData,
          { reportId: args.reportId, docId: args.docId },
        );

        const fixBranchName = `eva/eval-fix-${String(args.reportId).slice(-8)}`;

        await step.runMutation(internal.evaluationWorkflow.setFixing, {
          reportId: args.reportId,
          fixBranchName,
        });

        const { sandboxId: fixSandboxId } = await step.runAction(
          internal.daytona.prepareSandbox,
          {
            installationId: args.installationId,
            repoOwner: fixData.repoOwner,
            repoName: fixData.repoName,
            branchName: fixBranchName,
            baseBranch: args.branchName ?? "main",
            ephemeral: true,
            repoId: fixData.repoId,
            streamingEntityId: String(args.reportId),
          },
        );

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
          const prUrl = await step.runAction(
            internal.taskWorkflowActions.createPullRequest,
            {
              installationId: args.installationId,
              repoOwner: fixData.repoOwner,
              repoName: fixData.repoName,
              branchName: fixBranchName,
              baseBranch: args.branchName ?? "main",
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
      }
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
  returns: v.object({ hasFailures: v.boolean() }),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.reportId));

    const report = await ctx.db.get(args.reportId);
    if (!report) return { hasFailures: false };

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

        const hasFailures = results.some((r) => !r.passed);

        await ctx.db.patch(args.reportId, {
          status: "completed",
          results,
          summary:
            typeof parsed.summary === "string"
              ? parsed.summary
              : "Evaluation completed",
          activeWorkflowId: hasFailures ? report.activeWorkflowId : undefined,
          updatedAt: Date.now(),
        });
        return { hasFailures };
      }
    }

    await ctx.db.patch(args.reportId, {
      status: "error",
      error: args.error || "Failed to parse evaluation results",
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return { hasFailures: false };
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
4. Make sure your changes don't break existing functionality

Rules:
- Make minimal, focused changes to fix only the failing requirements
- Follow existing code patterns and conventions
- Do not refactor unrelated code
- Commit and push all changes when done${rootDirInstruction}`;

    const prDescription = `## Evaluation Fix

Automatically generated fix for failing requirements in **${doc.title}**.

### Issues Fixed:
${failedResults.map((r) => `- ${r.requirement}: ${r.detail}`).join("\n")}

---
*Implemented by Eva AI Agent*`;

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

export const setFixing = internalMutation({
  args: {
    reportId: v.id("evaluationReports"),
    fixBranchName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      fixStatus: "fixing",
      fixBranchName: args.fixBranchName,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const saveFixResult = internalMutation({
  args: {
    reportId: v.id("evaluationReports"),
    prUrl: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.reportId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    await ctx.db.patch(args.reportId, {
      fixStatus: "fix_completed",
      prUrl: args.prUrl ?? undefined,
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const saveFixError = internalMutation({
  args: {
    reportId: v.id("evaluationReports"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.reportId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    await ctx.db.patch(args.reportId, {
      fixStatus: "fix_error",
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

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

    await workflow.sendEvent(ctx, {
      ...fixCompleteEvent,
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
      entityTitle: "Evaluation Fix",
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
