"use node";

import { ActionCache } from "@convex-dev/action-cache";
import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { components, internal } from "../_generated/api";
import { getInstallationOctokit } from "../githubAuth";
import type { Id } from "../_generated/dataModel";

const MAX_LIST_PAGES = 3;
const MAX_ISSUE_COMMENTS = 100;
const MAX_REVIEW_COMMENTS = 100;
const MAX_CHECKS = 40;

/** Overview GitHub payload is moderately volatile (checks/comments). */
const PR_OVERVIEW_CACHE_TTL_MS = 60_000;

const pullRequestListItemValidator = v.object({
  number: v.number(),
  title: v.string(),
  state: v.union(v.literal("open"), v.literal("closed")),
  draft: v.boolean(),
  authorLogin: v.union(v.string(), v.null()),
  updatedAt: v.string(),
  createdAt: v.string(),
  htmlUrl: v.string(),
});

const pullRequestCommentValidator = v.object({
  id: v.number(),
  kind: v.union(v.literal("issue"), v.literal("review")),
  body: v.string(),
  authorLogin: v.union(v.string(), v.null()),
  authorAvatarUrl: v.union(v.string(), v.null()),
  createdAt: v.string(),
  htmlUrl: v.string(),
  /** Present for inline review comments. */
  path: v.optional(v.string()),
  line: v.optional(v.union(v.number(), v.null())),
});

const pullRequestCheckValidator = v.object({
  name: v.string(),
  status: v.string(),
  conclusion: v.union(v.string(), v.null()),
  htmlUrl: v.union(v.string(), v.null()),
});

const pullRequestOverviewValidator = v.object({
  number: v.number(),
  title: v.string(),
  status: v.union(v.literal("open"), v.literal("closed"), v.literal("merged")),
  draft: v.boolean(),
  body: v.union(v.string(), v.null()),
  authorLogin: v.union(v.string(), v.null()),
  authorAvatarUrl: v.union(v.string(), v.null()),
  htmlUrl: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  changedFiles: v.number(),
  additions: v.number(),
  deletions: v.number(),
  checks: v.array(pullRequestCheckValidator),
  checksTruncated: v.boolean(),
  comments: v.array(pullRequestCommentValidator),
  commentsTruncated: v.boolean(),
});

type PullRequestListItem = {
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  authorLogin: string | null;
  updatedAt: string;
  createdAt: string;
  htmlUrl: string;
};

type PullRequestComment = {
  id: number;
  kind: "issue" | "review";
  body: string;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  createdAt: string;
  htmlUrl: string;
  path?: string;
  line?: number | null;
};

type PullRequestCheck = {
  name: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string | null;
};

type PullRequestOverview = {
  number: number;
  title: string;
  /** Derived PR lifecycle for the sidebar meta column. */
  status: "open" | "closed" | "merged";
  draft: boolean;
  body: string | null;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  checks: PullRequestCheck[];
  checksTruncated: boolean;
  comments: PullRequestComment[];
  commentsTruncated: boolean;
};

function derivePrStatus(
  state: string,
  merged: boolean | null | undefined,
): "open" | "closed" | "merged" {
  if (merged === true) return "merged";
  return state === "open" ? "open" : "closed";
}

/**
 * Lists pull requests for the GitHub repo behind an Eva githubRepos row.
 * Codebase-wide (owner/name), not scoped to rootDirectory / app.
 */
export const listPullRequests = action({
  args: {
    repoId: v.id("githubRepos"),
    state: v.union(v.literal("open"), v.literal("closed"), v.literal("all")),
  },
  returns: v.array(pullRequestListItemValidator),
  handler: async (ctx, args): Promise<PullRequestListItem[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });
    if (!repo) throw new Error("Repo not found");

    const octokit = await getInstallationOctokit(repo.installationId);
    const pulls: PullRequestListItem[] = [];
    for (let page = 1; page <= MAX_LIST_PAGES; page++) {
      const { data } = await octokit.rest.pulls.list({
        owner: repo.owner,
        repo: repo.name,
        state: args.state,
        sort: "updated",
        direction: "desc",
        per_page: 100,
        page,
      });
      for (const pr of data) {
        pulls.push({
          number: pr.number,
          title: pr.title,
          state: pr.state === "open" ? "open" : "closed",
          draft: pr.draft === true,
          authorLogin: pr.user?.login ?? null,
          updatedAt: pr.updated_at,
          createdAt: pr.created_at,
          htmlUrl: pr.html_url,
        });
      }
      if (data.length < 100) break;
    }

    return pulls;
  },
});

/**
 * Lightweight PR title/meta for the Reviews detail chrome (above tabs).
 */
export const getPullRequestHeader = action({
  args: {
    repoId: v.id("githubRepos"),
    prNumber: v.number(),
  },
  returns: v.object({
    number: v.number(),
    title: v.string(),
    authorLogin: v.union(v.string(), v.null()),
    htmlUrl: v.string(),
    updatedAt: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });
    if (!repo) throw new Error("Repo not found");

    const octokit = await getInstallationOctokit(repo.installationId);
    const { data: pr } = await octokit.rest.pulls.get({
      owner: repo.owner,
      repo: repo.name,
      pull_number: args.prNumber,
    });

    return {
      number: pr.number,
      title: pr.title,
      authorLogin: pr.user?.login ?? null,
      htmlUrl: pr.html_url,
      updatedAt: pr.updated_at,
    };
  },
});

/**
 * Uncached GitHub Overview fetch — wrapped by ActionCache. Auth is enforced by
 * the public `getPullRequestOverview` wrapper before `fetch`.
 */
export const fetchPullRequestOverview = internalAction({
  args: {
    repoId: v.id("githubRepos"),
    prNumber: v.number(),
  },
  returns: pullRequestOverviewValidator,
  handler: async (ctx, args): Promise<PullRequestOverview> => {
    const repoId: Id<"githubRepos"> = args.repoId;
    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: repoId,
    });
    if (!repo) throw new Error("Repo not found");

    const octokit = await getInstallationOctokit(repo.installationId);
    const { data: pr } = await octokit.rest.pulls.get({
      owner: repo.owner,
      repo: repo.name,
      pull_number: args.prNumber,
    });

    const [issueRes, reviewRes, checksRes] = await Promise.all([
      octokit.rest.issues.listComments({
        owner: repo.owner,
        repo: repo.name,
        issue_number: args.prNumber,
        per_page: MAX_ISSUE_COMMENTS,
      }),
      octokit.rest.pulls.listReviewComments({
        owner: repo.owner,
        repo: repo.name,
        pull_number: args.prNumber,
        per_page: MAX_REVIEW_COMMENTS,
      }),
      octokit.rest.checks
        .listForRef({
          owner: repo.owner,
          repo: repo.name,
          ref: pr.head.sha,
          per_page: MAX_CHECKS,
        })
        .catch(() => ({ data: { check_runs: [], total_count: 0 } })),
    ]);

    const checkRuns = checksRes.data.check_runs;
    const checks: PullRequestCheck[] = checkRuns
      .slice(0, MAX_CHECKS)
      .map((run) => ({
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        htmlUrl: run.html_url,
      }));

    const comments: PullRequestComment[] = [
      ...issueRes.data.map(
        (c): PullRequestComment => ({
          id: c.id,
          kind: "issue",
          body: c.body ?? "",
          authorLogin: c.user?.login ?? null,
          authorAvatarUrl: c.user?.avatar_url ?? null,
          createdAt: c.created_at,
          htmlUrl: c.html_url,
        }),
      ),
      ...reviewRes.data.map(
        (c): PullRequestComment => ({
          id: c.id,
          kind: "review",
          body: c.body ?? "",
          authorLogin: c.user?.login ?? null,
          authorAvatarUrl: c.user?.avatar_url ?? null,
          createdAt: c.created_at,
          htmlUrl: c.html_url,
          path: c.path,
          line: c.line ?? c.original_line ?? null,
        }),
      ),
    ].toSorted(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    return {
      number: pr.number,
      title: pr.title,
      status: derivePrStatus(pr.state, pr.merged),
      draft: pr.draft === true,
      body: pr.body ?? null,
      authorLogin: pr.user?.login ?? null,
      authorAvatarUrl: pr.user?.avatar_url ?? null,
      htmlUrl: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      changedFiles: pr.changed_files,
      additions: pr.additions,
      deletions: pr.deletions,
      checks,
      checksTruncated: checksRes.data.total_count > MAX_CHECKS,
      comments,
      commentsTruncated:
        issueRes.data.length >= MAX_ISSUE_COMMENTS ||
        reviewRes.data.length >= MAX_REVIEW_COMMENTS,
    };
  },
});

const prOverviewCache = new ActionCache(components.actionCache, {
  action: internal._github.pullRequests.fetchPullRequestOverview,
  name: "prOverviewV1",
  ttl: PR_OVERVIEW_CACHE_TTL_MS,
});

/**
 * PR description plus issue comments and review comments for the Reviews
 * Overview tab. Soft-capped to keep action payloads bounded. Results are
 * ActionCache-backed (60s TTL); pass `force` to bypass (Retry).
 */
export const getPullRequestOverview = action({
  args: {
    repoId: v.id("githubRepos"),
    prNumber: v.number(),
    force: v.optional(v.boolean()),
  },
  returns: pullRequestOverviewValidator,
  handler: async (ctx, args): Promise<PullRequestOverview> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await prOverviewCache.fetch(
      ctx,
      { repoId: args.repoId, prNumber: args.prNumber },
      { force: args.force === true },
    );
  },
});
