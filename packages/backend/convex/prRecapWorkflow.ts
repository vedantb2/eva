import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalQuery } from "./_generated/server";
import { defineEvent } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { workflowCompleteValidator, aiModelValidator } from "./validators";
import { trackDocWorkflow } from "./workflowWatchdog";
import {
  clearStreamingActivity,
  recordCompletionLog,
  sendCompletionEvent,
} from "./_taskWorkflow/helpers";
import { prepareSandboxSteps } from "./_daytona/prepareSandboxSteps";
import { buildPrRecapPrompt } from "./_prRecapWorkflow/prompts";
import { buildPrRecapCommentBody } from "./_github/prComments";
import { buildEvaDocUrl } from "./_taskWorkflow/urls";
import { normalizeAIModel } from "./_validators/aiModels";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";

const prRecapCompleteEvent = defineEvent({
  name: "prRecapComplete",
  validator: workflowCompleteValidator,
});

const MIN_DIFF_LINES = 3;

/** Runs PR recap generation: fetch diff, Claude Code in sandbox, save doc, upsert GitHub comment. */
export const prRecapWorkflow = workflow.define({
  args: {
    docId: v.id("docs"),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    userId: v.id("users"),
    prNumber: v.number(),
    prUrl: v.string(),
    prTitle: v.string(),
    headSha: v.string(),
  },
  handler: async (step, args): Promise<void> => {
    const repoData = await step.runQuery(internal.prRecapWorkflow.getRepoData, {
      repoId: args.repoId,
    });

    const model = normalizeAIModel(
      repoData.prRecapModel ?? repoData.defaultModel ?? "sonnet",
    );

    const authCheck = await step.runAction(
      internal.githubPrRecapActions.checkProviderAuth,
      { repoId: args.repoId, model },
    );
    if (!authCheck.ok) {
      await step.runMutation(internal.docs.patchPrRecapStatus, {
        docId: args.docId,
        prRecapStatus: "error",
        prRecapError: authCheck.message,
        activeWorkflowId: null,
      });
      await step.runAction(internal.githubPrRecapActions.upsertPrRecapComment, {
        installationId: args.installationId,
        owner: repoData.repoOwner,
        repo: repoData.repoName,
        prNumber: args.prNumber,
        body: buildPrRecapCommentBody({
          evaDocUrl: buildEvaDocUrl(
            repoData.repoOwner,
            repoData.repoName,
            String(args.docId),
          ),
          prNumber: args.prNumber,
          headSha: args.headSha,
          status: "error",
          message: authCheck.message,
        }),
      });
      return;
    }

    const diff = await step.runAction(
      internal.githubPrRecapActions.fetchPrDiff,
      {
        installationId: args.installationId,
        owner: repoData.repoOwner,
        repo: repoData.repoName,
        prNumber: args.prNumber,
      },
    );

    if (diff.additions + diff.deletions < MIN_DIFF_LINES) {
      const skipMessage = "Diff too small to recap";
      await step.runMutation(internal.docs.patchPrRecapStatus, {
        docId: args.docId,
        prRecapStatus: "error",
        prRecapError: skipMessage,
        activeWorkflowId: null,
      });
      await step.runAction(internal.githubPrRecapActions.upsertPrRecapComment, {
        installationId: args.installationId,
        owner: repoData.repoOwner,
        repo: repoData.repoName,
        prNumber: args.prNumber,
        body: buildPrRecapCommentBody({
          evaDocUrl: buildEvaDocUrl(
            repoData.repoOwner,
            repoData.repoName,
            String(args.docId),
          ),
          prNumber: args.prNumber,
          headSha: args.headSha,
          status: "skipped",
          message: skipMessage,
        }),
      });
      return;
    }

    const prompt = buildPrRecapPrompt({
      prTitle: args.prTitle,
      prNumber: args.prNumber,
      prUrl: args.prUrl,
      headSha: args.headSha,
      diffText: diff.diffText,
      diffStats: {
        additions: diff.additions,
        deletions: diff.deletions,
        changedFiles: diff.changedFiles,
        truncated: diff.truncated,
      },
    });

    const sandboxId = await prepareSandboxSteps(step, {
      installationId: args.installationId,
      repoOwner: repoData.repoOwner,
      repoName: repoData.repoName,
      repoId: args.repoId,
      ephemeral: true,
      streamingEntityId: `pr-recap:${String(args.docId)}`,
      baseBranch: repoData.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH,
      createRetry: { maxAttempts: 1, initialBackoffMs: 2000, base: 2 },
    });

    await step.runAction(internal.daytona.launchOnExistingSandbox, {
      sandboxId,
      entityId: String(args.docId),
      streamingEntityId: `pr-recap:${String(args.docId)}`,
      prompt,
      userId: args.userId,
      completionMutation: "prRecapWorkflow:handleCompletion",
      entityIdField: "docId",
      model,
      allowedTools: "",
      repoId: args.repoId,
    });

    const result = await step.awaitEvent(prRecapCompleteEvent);

    const evaDocUrl = buildEvaDocUrl(
      repoData.repoOwner,
      repoData.repoName,
      String(args.docId),
    );

    if (result.success && result.result) {
      await step.runMutation(internal.docs.upsertPrRecapDoc, {
        repoId: args.repoId,
        prUrl: args.prUrl,
        prNumber: args.prNumber,
        title: `PR #${args.prNumber} — ${args.prTitle}`,
        headSha: args.headSha,
        content: result.result.trim(),
        prRecapStatus: "ready",
        prRecapError: undefined,
      });
      await step.runMutation(internal.docs.patchPrRecapStatus, {
        docId: args.docId,
        prRecapStatus: "ready",
        activeWorkflowId: null,
      });
      await step.runAction(internal.githubPrRecapActions.upsertPrRecapComment, {
        installationId: args.installationId,
        owner: repoData.repoOwner,
        repo: repoData.repoName,
        prNumber: args.prNumber,
        body: buildPrRecapCommentBody({
          evaDocUrl,
          prNumber: args.prNumber,
          headSha: args.headSha,
          status: "ready",
        }),
      });
      return;
    }

    const errorMessage = result.error ?? "Recap generation failed";
    await step.runMutation(internal.docs.patchPrRecapStatus, {
      docId: args.docId,
      prRecapStatus: "error",
      prRecapError: errorMessage,
      activeWorkflowId: null,
    });
    await step.runAction(internal.githubPrRecapActions.upsertPrRecapComment, {
      installationId: args.installationId,
      owner: repoData.repoOwner,
      repo: repoData.repoName,
      prNumber: args.prNumber,
      body: buildPrRecapCommentBody({
        evaDocUrl,
        prNumber: args.prNumber,
        headSha: args.headSha,
        status: "error",
        message: errorMessage,
      }),
    });
  },
});

/** Loads repo settings needed for PR recap generation. */
export const getRepoData = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.object({
    repoOwner: v.string(),
    repoName: v.string(),
    defaultBaseBranch: v.optional(v.string()),
    defaultModel: v.optional(aiModelValidator),
    prRecapModel: v.optional(aiModelValidator),
  }),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");
    return {
      repoOwner: repo.owner,
      repoName: repo.name,
      defaultBaseBranch: repo.defaultBaseBranch,
      defaultModel: repo.defaultModel,
      prRecapModel: repo.prRecapModel,
    };
  },
});

/** Receives sandbox completion callback and forwards the event to the active recap workflow. */
export const handleCompletion = authMutation({
  args: {
    docId: v.id("docs"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || !doc.activeWorkflowId) return null;

    await clearStreamingActivity(ctx, `pr-recap:${String(args.docId)}`);

    await sendCompletionEvent(ctx, prRecapCompleteEvent, doc.activeWorkflowId, {
      success: args.success,
      result: args.result,
      error: args.error,
      activityLog: args.activityLog,
    });

    await recordCompletionLog(ctx, {
      entityType: "doc",
      entityId: String(args.docId),
      entityTitle: doc.title,
      repoId: doc.repoId,
      rawResultEvent: args.rawResultEvent,
    });

    return null;
  },
});
