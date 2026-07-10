"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { buildPrBody } from "../prBody";
import { buildEvaSessionUrl } from "../_taskWorkflow/urls";
import { extractPrNumber } from "./helpers";

/**
 * Promotes a session's draft PR to ready-for-review and archives the sandbox.
 * Called when the user clicks "Send for Review". Draft PRs are opened
 * automatically after the first successful agent push (`createDraftSessionPr`);
 * this path only flips draft → open. If a draft is somehow missing (older
 * sessions), it creates one first then promotes so the button still works.
 */
export const createSessionPr = action({
  args: { sessionId: v.id("sessions") },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: args.sessionId,
    });
    if (!session) throw new Error("Session not found");
    if (!session.branchName) {
      throw new Error("No branch associated with this session");
    }

    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: session.repoId,
    });
    if (!repo) throw new Error("Repository not found");

    let prUrl = session.prUrl;
    if (prUrl === undefined) {
      // Recovery for sessions that pushed commits before auto-draft existed.
      const created = await ctx.runAction(
        internal.github.createDraftSessionPr,
        {
          sessionId: args.sessionId,
        },
      );
      if (created === null) {
        throw new Error(
          "No draft PR to send for review. Make an edit so Eva can open one, then try again.",
        );
      }
      prUrl = created;
    }

    const prNumber = extractPrNumber(prUrl);
    if (prNumber) {
      await ctx.runAction(internal.taskWorkflowActions.markPrReadyForReview, {
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        prNumber,
      });
    }

    await ctx.runMutation(internal.sessions.markReadyAndArchive, {
      id: args.sessionId,
    });
    return { url: prUrl };
  },
});

/**
 * Opens a draft PR for a session branch after the first successful push.
 * Idempotent: returns the existing prUrl when one is already stored.
 * Called from sessionExecuteWorkflow after pushSandboxBranch succeeds; also
 * retried on later turns if the first attempt failed.
 */
export const createDraftSessionPr = internalAction({
  args: { sessionId: v.id("sessions") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args): Promise<string | null> => {
    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: args.sessionId,
    });
    if (!session) return null;
    if (!session.branchName) return null;
    if (session.prUrl) return session.prUrl;

    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: session.repoId,
    });
    if (!repo) return null;

    const appLabel: string | undefined = repo.rootDirectory
      ? repo.rootDirectory.split("/").pop()
      : undefined;

    const summaryContent: string =
      session.summary && session.summary.length > 0
        ? session.summary.map((item: string) => `- ${item}`).join("\n")
        : "_Summary will be generated before review_";

    const evaUrl = buildEvaSessionUrl(
      repo.owner,
      repo.name,
      args.sessionId,
      repo.rootDirectory,
    );

    const result: string = await ctx.runAction(
      internal.taskWorkflowActions.createPullRequest,
      {
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName: session.branchName,
        baseBranch: repo.defaultBaseBranch,
        title: session.title,
        body: buildPrBody(
          [{ heading: "Summary", content: summaryContent }],
          evaUrl,
        ),
        labels: ["eva", "session", "draft", ...(appLabel ? [appLabel] : [])],
        draft: true,
      },
    );

    await ctx.runMutation(internal.sessions.setPrUrl, {
      id: args.sessionId,
      prUrl: result,
      prState: "draft",
    });
    console.log(
      `[github] Created draft PR for session ${args.sessionId}: ${result}`,
    );

    return result;
  },
});
