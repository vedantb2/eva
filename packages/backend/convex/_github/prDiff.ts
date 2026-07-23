"use node";

import { ActionCache } from "@convex-dev/action-cache";
import { v } from "convex/values";
import { z } from "zod";
import { action, internalAction } from "../_generated/server";
import { components, internal } from "../_generated/api";
import { getInstallationOctokit } from "../githubAuth";
import { extractPrNumber } from "./helpers";

/** Cap the diff we return to the client so huge PRs don't blow the payload. */
const MAX_DIFF_BYTES = 500_000;

/** Pushed PR diffs change less often than checks/comments. */
const PR_DIFF_CACHE_TTL_MS = 120_000;

const prDiffResultValidator = v.object({
  diff: v.string(),
  /** True when the diff was clipped at MAX_DIFF_BYTES. */
  truncated: v.boolean(),
});

type PrDiffResult = {
  diff: string;
  truncated: boolean;
};

/**
 * Uncached GitHub PR diff fetch — wrapped by ActionCache. Auth is enforced by
 * the public `getPrDiff` wrapper before `fetch`.
 */
export const fetchPrDiff = internalAction({
  args: {
    repoId: v.id("githubRepos"),
    prNumber: v.number(),
  },
  returns: prDiffResultValidator,
  handler: async (ctx, args): Promise<PrDiffResult> => {
    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });
    if (!repo) throw new Error("Repo not found");

    const octokit = await getInstallationOctokit(repo.installationId);
    const res = await octokit.rest.pulls.get({
      owner: repo.owner,
      repo: repo.name,
      pull_number: args.prNumber,
      mediaType: { format: "diff" },
    });
    // With the diff media type GitHub returns raw unified-diff text, but octokit
    // types `data` as the PR object — parse to a string at the boundary.
    const fullDiff = z.string().parse(res.data);

    const truncated = fullDiff.length > MAX_DIFF_BYTES;
    // Clip on a line boundary so the final file stays parseable.
    const diff = truncated
      ? fullDiff.slice(0, fullDiff.lastIndexOf("\n", MAX_DIFF_BYTES))
      : fullDiff;

    return { diff, truncated };
  },
});

const prDiffCache = new ActionCache(components.actionCache, {
  action: internal._github.prDiff.fetchPrDiff,
  name: "prDiffV1",
  ttl: PR_DIFF_CACHE_TTL_MS,
});

/**
 * Public action powering the sandbox "Diffs" tab. Fetches the canonical PR diff
 * from GitHub (the raw unified-diff media type) so the client can render it with
 * `@pierre/diffs`. Reflects what has been pushed to the PR, not uncommitted
 * working-tree changes. ActionCache-backed (120s TTL); pass `force` to bypass
 * (Refresh).
 */
export const getPrDiff = action({
  args: {
    repoId: v.id("githubRepos"),
    /** Preferred when the caller already has a PR number (Reviews routes). */
    prNumber: v.optional(v.number()),
    /** Sandbox Review still passes the full PR URL. */
    prUrl: v.optional(v.string()),
    force: v.optional(v.boolean()),
  },
  returns: prDiffResultValidator,
  handler: async (ctx, args): Promise<PrDiffResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const prNumber =
      args.prNumber !== undefined
        ? args.prNumber
        : args.prUrl !== undefined
          ? extractPrNumber(args.prUrl)
          : null;
    if (prNumber === null) {
      throw new Error(
        args.prUrl !== undefined
          ? `Could not parse a PR number from URL: ${args.prUrl}`
          : "prNumber or prUrl is required",
      );
    }

    return await prDiffCache.fetch(
      ctx,
      { repoId: args.repoId, prNumber },
      { force: args.force === true },
    );
  },
});
