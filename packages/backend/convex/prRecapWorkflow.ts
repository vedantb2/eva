import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalQuery } from "./_generated/server";
import { defineEvent } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { workflowCompleteValidator, aiModelValidator } from "./validators";
import {
  clearStreamingActivity,
  recordCompletionLog,
  sendCompletionEvent,
} from "./_taskWorkflow/helpers";
import { prepareSandboxSteps } from "./_daytona/prepareSandboxSteps";
import {
  buildPrRecapPrompt,
  parsePrRecapOutput,
} from "./_prRecapWorkflow/prompts";
import {
  finalizePrRecapOutcome,
  type PrRecapOutcome,
} from "./_prRecapWorkflow/finalizeOutcome";
import { normalizeAIModel } from "./_validators/aiModels";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import {
  findSiblingRepos,
  pickDefaultVisibleAppRepo,
} from "./_githubRepos/helpers";

const prRecapCompleteEvent = defineEvent({
  name: "prRecapComplete",
  validator: workflowCompleteValidator,
});

const MIN_DIFF_LINES = 3;

const reviewerFeedbackItemValidator = v.object({
  anchorText: v.optional(v.string()),
  content: v.string(),
});

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
    reviewerFeedback: v.optional(v.array(reviewerFeedbackItemValidator)),
    consumeAgentCommentIds: v.optional(v.array(v.id("docComments"))),
  },
  handler: async (step, args): Promise<void> => {
    const repoData = await step.runQuery(internal.prRecapWorkflow.getRepoData, {
      repoId: args.repoId,
    });

    const model = normalizeAIModel(
      repoData.prRecapModel ?? repoData.defaultModel ?? "sonnet",
    );

    function finalize(outcome: PrRecapOutcome): Promise<void> {
      return finalizePrRecapOutcome(step, {
        ...args,
        repoOwner: repoData.repoOwner,
        repoName: repoData.repoName,
        linkRootDirectory: repoData.linkRootDirectory,
        outcome,
      });
    }

    const authCheck = await step.runAction(
      internal._github.prRecapService.checkProviderAuth,
      { repoId: args.repoId, model },
    );
    if (!authCheck.ok) {
      await finalize({ kind: "error", message: authCheck.message });
      return;
    }

    const diff = await step.runAction(
      internal._github.prRecapService.fetchPrDiff,
      {
        installationId: args.installationId,
        owner: repoData.repoOwner,
        repo: repoData.repoName,
        prNumber: args.prNumber,
      },
    );

    if (diff.additions + diff.deletions < MIN_DIFF_LINES) {
      await finalize({ kind: "skipped", message: "Diff too small to recap" });
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
      reviewerFeedback: args.reviewerFeedback,
    });

    let sandboxId: string | undefined;
    try {
      ({ sandboxId } = await prepareSandboxSteps(step, {
        installationId: args.installationId,
        repoOwner: repoData.repoOwner,
        repoName: repoData.repoName,
        repoId: args.repoId,
        ephemeral: true,
        streamingEntityId: `pr-recap:${String(args.docId)}`,
        baseBranch: repoData.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH,
        createRetry: { maxAttempts: 1, initialBackoffMs: 2000, base: 2 },
        // Recap agents only read the diff in-repo; no convex import / dev daemons.
        skipStartupCommands: true,
      }));

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

      if (result.success && result.result) {
        const { markdown, html } = parsePrRecapOutput(result.result);
        await finalize({ kind: "ready", content: markdown, html });
        if (
          args.consumeAgentCommentIds &&
          args.consumeAgentCommentIds.length > 0
        ) {
          await step.runMutation(
            internal.docComments.resolveRecapAgentComments,
            {
              docId: args.docId,
              commentIds: args.consumeAgentCommentIds,
              resolvedBy: args.userId,
            },
          );
        }
        return;
      }

      await finalize({
        kind: "error",
        message: result.error ?? "Recap generation failed",
      });
    } finally {
      if (sandboxId) {
        try {
          await step.runAction(internal.daytona.deleteSandbox, {
            sandboxId,
            repoId: args.repoId,
          });
        } catch (cleanupError) {
          console.error("Failed to cleanup PR recap sandbox:", cleanupError);
        }
      }
    }
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
    linkRootDirectory: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");
    const siblings = await findSiblingRepos(ctx.db, args.repoId);
    const linkRepo = pickDefaultVisibleAppRepo(siblings);
    return {
      repoOwner: repo.owner,
      repoName: repo.name,
      defaultBaseBranch: repo.defaultBaseBranch,
      defaultModel: repo.defaultModel,
      prRecapModel: repo.prRecapModel,
      linkRootDirectory: linkRepo?.rootDirectory,
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
