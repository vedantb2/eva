"use node";

import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { buildPrBody } from "../prBody";
import { buildEvaSessionUrl } from "../_taskWorkflow/urls";
import { extractPrNumber } from "./helpers";

/** Creates a GitHub pull request for a session's branch and stores the PR URL.
 * If a draft PR already exists, marks it as ready for review. */
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

    // If PR already exists (draft), mark it ready for review and archive sandbox
    if (session.prUrl) {
      const prNumber = extractPrNumber(session.prUrl);
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
      return { url: session.prUrl };
    }

    if (session.sandboxId) {
      try {
        await ctx.runAction(internal.daytona.pushSandboxBranch, {
          sandboxId: session.sandboxId,
          installationId: repo.installationId,
          repoOwner: repo.owner,
          repoName: repo.name,
          repoId: session.repoId,
          branchName: session.branchName,
        });
      } catch (error) {
        throw new Error(
          `Failed to publish session branch before creating PR: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // No PR exists yet - create a non-draft PR (fallback for older sessions)
    const appLabel = repo.rootDirectory
      ? repo.rootDirectory.split("/").pop()
      : undefined;

    const summaryContent =
      session.summary && session.summary.length > 0
        ? session.summary.map((item: string) => `- ${item}`).join("\n")
        : "No summary available";

    const evaUrl = buildEvaSessionUrl(
      repo.owner,
      repo.name,
      args.sessionId,
      repo.rootDirectory,
    );

    const prUrl = await ctx.runAction(
      internal.taskWorkflowActions.createPullRequest,
      {
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName: session.branchName,
        title: session.title,
        body: buildPrBody(
          [{ heading: "Summary", content: summaryContent }],
          evaUrl,
        ),
        labels: ["eva", "session", ...(appLabel ? [appLabel] : [])],
      },
    );

    if (!prUrl) {
      throw new Error("Failed to create PR");
    }

    await ctx.runMutation(internal.sessions.setPrUrl, {
      id: args.sessionId,
      prUrl,
      prState: "open",
    });

    // Non-draft PR fallback path: also archive the sandbox.
    await ctx.runMutation(internal.sessions.markReadyAndArchive, {
      id: args.sessionId,
    });

    return { url: prUrl };
  },
});

/** Creates a draft PR for a session. Called after first successful execution. */
export const createDraftSessionPr = internalAction({
  args: { sessionId: v.id("sessions") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args): Promise<string | null> => {
    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: args.sessionId,
    });
    if (!session) return null;
    if (!session.branchName) return null;
    if (session.prUrl) return session.prUrl; // Draft PR already exists

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

    const result: string | null = await ctx.runAction(
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

    if (result) {
      await ctx.runMutation(internal.sessions.setPrUrl, {
        id: args.sessionId,
        prUrl: result,
        prState: "draft",
      });
      console.log(
        `[github] Created draft PR for session ${args.sessionId}: ${result}`,
      );
    }

    return result;
  },
});
