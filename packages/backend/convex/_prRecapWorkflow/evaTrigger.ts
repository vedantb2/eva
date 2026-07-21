import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation } from "../_generated/server";
import { findSiblingRepos } from "../_githubRepos/helpers";
import { extractPrNumberFromUrl } from "../_projects/prSync";

/**
 * Cheap workflow-facing step: gate on prRecapsEnabled, then schedule the
 * GitHub-touching action so recap failures never fail the agent run.
 */
export const scheduleEvaPrRecap = internalMutation({
  args: {
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
    prUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const siblings = await findSiblingRepos(ctx.db, args.repoId);
    if (!siblings.some((repo) => repo.prRecapsEnabled === true)) {
      return null;
    }
    await ctx.scheduler.runAfter(
      0,
      internal._prRecapWorkflow.evaTrigger.triggerEvaPrRecap,
      args,
    );
    return null;
  },
});

/**
 * Auto-recap for Eva draft PRs. Non-drafts are skipped — the webhook already
 * recaps those on every push (avoids double generation after promotion).
 */
export const triggerEvaPrRecap = internalAction({
  args: {
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
    prUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const prNumber = extractPrNumberFromUrl(args.prUrl);
    if (prNumber === null) {
      console.error(
        `[evaPrRecap] could not parse PR number from url=${args.prUrl}`,
      );
      return null;
    }

    const gate = await ctx.runQuery(
      internal._prRecapWorkflow.start.getRecapSiblingsGate,
      { repoId: args.repoId },
    );
    if (!gate) return null;

    const metadata = await ctx.runAction(
      internal._github.prRecapService.fetchPrMetadata,
      {
        installationId: gate.installationId,
        owner: gate.owner,
        repo: gate.name,
        prNumber,
      },
    );

    // Webhook owns non-draft PRs; only draft Eva work needs this path.
    if (!metadata.draft) return null;

    await ctx.runMutation(internal.docs.startPrRecap, {
      repoId: gate.workflowRepoId,
      userId: args.userId,
      installationId: gate.installationId,
      owner: gate.owner,
      name: gate.name,
      prUrl: metadata.prUrl,
      prNumber: metadata.prNumber,
      prTitle: metadata.prTitle,
      headSha: metadata.headSha,
      prRecapOrigin: "eva",
    });
    return null;
  },
});
