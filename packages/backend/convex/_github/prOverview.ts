"use node";

import { ActionCache } from "@convex-dev/action-cache";
import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { components, internal } from "../_generated/api";
import { getInstallationOctokit } from "../githubAuth";
import type { Id } from "../_generated/dataModel";

const MAX_ISSUE_COMMENTS = 100;
const MAX_REVIEW_COMMENTS = 100;
const MAX_CHECKS = 40;
const MAX_COMMITS = 30;

/** Overview GitHub payload is moderately volatile (checks/comments). */
const PR_OVERVIEW_CACHE_TTL_MS = 60_000;

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
  /**
   * Review this inline comment belongs to, so the timeline can nest it under the
   * matching review verdict. Null for standalone (issue) comments.
   */
  reviewId: v.optional(v.union(v.number(), v.null())),
});

const pullRequestCheckValidator = v.object({
  /**
   * Check runs come from the Checks API; statuses come from the older commit
   * status API. GitHub's own PR page merges both, and review bots split across
   * the two, so keep the origin for grouping/labelling.
   */
  kind: v.union(v.literal("check"), v.literal("status")),
  name: v.string(),
  status: v.string(),
  conclusion: v.union(v.string(), v.null()),
  htmlUrl: v.union(v.string(), v.null()),
  /** Short bot-authored summary line, e.g. "3 issues found". */
  description: v.union(v.string(), v.null()),
});

const pullRequestReviewValidator = v.object({
  id: v.number(),
  authorLogin: v.string(),
  authorAvatarUrl: v.union(v.string(), v.null()),
  /** APPROVED | CHANGES_REQUESTED | COMMENTED | DISMISSED | PENDING */
  state: v.string(),
  submittedAt: v.union(v.string(), v.null()),
  htmlUrl: v.string(),
});

/**
 * A submitted review as a timeline event — unlike `reviews` (collapsed to the
 * latest verdict per author for the sidebar), every submitted review is kept, in
 * order, with its body, because the conversation shows each one where it landed.
 */
const pullRequestReviewEventValidator = v.object({
  id: v.number(),
  authorLogin: v.string(),
  authorAvatarUrl: v.union(v.string(), v.null()),
  state: v.string(),
  submittedAt: v.union(v.string(), v.null()),
  htmlUrl: v.string(),
  body: v.string(),
});

const pullRequestActorValidator = v.object({
  login: v.string(),
  avatarUrl: v.union(v.string(), v.null()),
});

const pullRequestCommitValidator = v.object({
  sha: v.string(),
  /** First line only — the rest is body detail the list does not show. */
  message: v.string(),
  authorLogin: v.union(v.string(), v.null()),
  authorAvatarUrl: v.union(v.string(), v.null()),
  committedAt: v.union(v.string(), v.null()),
  htmlUrl: v.string(),
});

const pullRequestLabelValidator = v.object({
  name: v.string(),
  color: v.string(),
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
  headRef: v.string(),
  baseRef: v.string(),
  headSha: v.string(),
  changedFiles: v.number(),
  additions: v.number(),
  deletions: v.number(),
  /** GitHub's own count, which can exceed the returned `commits` page. */
  commitCount: v.number(),
  commits: v.array(pullRequestCommitValidator),
  commitsTruncated: v.boolean(),
  /** null while GitHub computes mergeability — the client retries. */
  mergeable: v.union(v.boolean(), v.null()),
  /** clean | dirty | blocked | behind | unstable | draft | unknown */
  mergeableState: v.string(),
  mergedAt: v.union(v.string(), v.null()),
  mergedByLogin: v.union(v.string(), v.null()),
  labels: v.array(pullRequestLabelValidator),
  /** Latest decisive review per reviewer, human or bot. */
  reviews: v.array(pullRequestReviewValidator),
  /** Every submitted review, in order, for the conversation timeline. */
  reviewEvents: v.array(pullRequestReviewEventValidator),
  requestedReviewers: v.array(pullRequestActorValidator),
  assignees: v.array(pullRequestActorValidator),
  checks: v.array(pullRequestCheckValidator),
  checksTruncated: v.boolean(),
  comments: v.array(pullRequestCommentValidator),
  commentsTruncated: v.boolean(),
});

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
  reviewId?: number | null;
};

type PullRequestCheck = {
  kind: "check" | "status";
  name: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string | null;
  description: string | null;
};

type PullRequestReview = {
  id: number;
  authorLogin: string;
  authorAvatarUrl: string | null;
  state: string;
  submittedAt: string | null;
  htmlUrl: string;
};

type PullRequestReviewEvent = PullRequestReview & { body: string };

type PullRequestActor = {
  login: string;
  avatarUrl: string | null;
};

type PullRequestCommit = {
  sha: string;
  message: string;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  committedAt: string | null;
  htmlUrl: string;
};

type PullRequestLabel = {
  name: string;
  color: string;
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
  headRef: string;
  baseRef: string;
  headSha: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  commitCount: number;
  commits: PullRequestCommit[];
  commitsTruncated: boolean;
  mergeable: boolean | null;
  mergeableState: string;
  mergedAt: string | null;
  mergedByLogin: string | null;
  labels: PullRequestLabel[];
  reviews: PullRequestReview[];
  reviewEvents: PullRequestReviewEvent[];
  requestedReviewers: PullRequestActor[];
  assignees: PullRequestActor[];
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
 * Collapse a review history into what GitHub shows: one row per reviewer. A
 * later "commented" review does not clear an earlier approval or change
 * request, so decisive states win and only then does recency decide.
 */
function latestReviewPerAuthor(
  reviews: PullRequestReview[],
): PullRequestReview[] {
  const decisive = new Set(["APPROVED", "CHANGES_REQUESTED", "DISMISSED"]);
  const byAuthor = new Map<string, PullRequestReview>();
  for (const review of reviews) {
    const current = byAuthor.get(review.authorLogin);
    if (!current) {
      byAuthor.set(review.authorLogin, review);
      continue;
    }
    const currentIsDecisive = decisive.has(current.state);
    const nextIsDecisive = decisive.has(review.state);
    if (currentIsDecisive && !nextIsDecisive) continue;
    byAuthor.set(review.authorLogin, review);
  }
  return [...byAuthor.values()];
}

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

    // Only checks and commit statuses need the head sha, so they chain off the
    // PR fetch while the other four calls start immediately — one round trip
    // instead of two on the uncached path.
    const prPromise = octokit.rest.pulls.get({
      owner: repo.owner,
      repo: repo.name,
      pull_number: args.prNumber,
    });

    const [
      pr,
      issueRes,
      reviewCommentRes,
      reviewRes,
      commitRes,
      checksRes,
      statusRes,
    ] = await Promise.all([
      prPromise.then((res) => res.data),
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
      octokit.rest.pulls
        .listReviews({
          owner: repo.owner,
          repo: repo.name,
          pull_number: args.prNumber,
          per_page: 100,
        })
        .catch(() => ({ data: [] })),
      octokit.rest.pulls
        .listCommits({
          owner: repo.owner,
          repo: repo.name,
          pull_number: args.prNumber,
          per_page: MAX_COMMITS,
        })
        .catch(() => ({ data: [] })),
      prPromise
        .then((res) =>
          octokit.rest.checks.listForRef({
            owner: repo.owner,
            repo: repo.name,
            ref: res.data.head.sha,
            per_page: MAX_CHECKS,
          }),
        )
        .catch(() => ({ data: { check_runs: [], total_count: 0 } })),
      // Older bots report through commit statuses rather than check runs.
      prPromise
        .then((res) =>
          octokit.rest.repos.getCombinedStatusForRef({
            owner: repo.owner,
            repo: repo.name,
            ref: res.data.head.sha,
          }),
        )
        .catch(() => ({ data: { statuses: [] } })),
    ]);

    const checkRuns: PullRequestCheck[] = checksRes.data.check_runs
      .slice(0, MAX_CHECKS)
      .map((run) => ({
        kind: "check",
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        htmlUrl: run.html_url,
        description: run.output?.title ?? null,
      }));

    const statusChecks: PullRequestCheck[] = statusRes.data.statuses.map(
      (status) => ({
        kind: "status",
        name: status.context,
        status: status.state === "pending" ? "in_progress" : "completed",
        conclusion:
          status.state === "pending"
            ? null
            : status.state === "success"
              ? "success"
              : "failure",
        htmlUrl: status.target_url ?? null,
        description: status.description ?? null,
      }),
    );

    const allReviews = reviewRes.data.flatMap(
      (review): PullRequestReviewEvent[] =>
        review.user
          ? [
              {
                id: review.id,
                authorLogin: review.user.login,
                authorAvatarUrl: review.user.avatar_url ?? null,
                state: review.state,
                submittedAt: review.submitted_at ?? null,
                htmlUrl: review.html_url,
                body: review.body ?? "",
              },
            ]
          : [],
    );
    const reviews = latestReviewPerAuthor(allReviews);
    // A pending review is an unsubmitted draft, so it never appears on the
    // conversation; the sidebar still collapses over the full history.
    const reviewEvents = allReviews.filter(
      (review) => review.state !== "PENDING",
    );

    const commits: PullRequestCommit[] = commitRes.data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message.split("\n")[0] ?? "",
      authorLogin: commit.author?.login ?? commit.commit.author?.name ?? null,
      authorAvatarUrl: commit.author?.avatar_url ?? null,
      committedAt: commit.commit.author?.date ?? null,
      htmlUrl: commit.html_url,
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
      ...reviewCommentRes.data.map(
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
          reviewId: c.pull_request_review_id ?? null,
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
      headRef: pr.head.ref,
      baseRef: pr.base.ref,
      headSha: pr.head.sha,
      changedFiles: pr.changed_files,
      additions: pr.additions,
      deletions: pr.deletions,
      commitCount: pr.commits,
      commits,
      commitsTruncated: pr.commits > commits.length,
      mergeable: pr.mergeable ?? null,
      mergeableState: pr.mergeable_state ?? "unknown",
      mergedAt: pr.merged_at ?? null,
      mergedByLogin: pr.merged_by?.login ?? null,
      labels: pr.labels.map((label) => ({
        name: label.name,
        color: label.color,
      })),
      reviews,
      reviewEvents,
      requestedReviewers: (pr.requested_reviewers ?? []).map((reviewer) => ({
        login: reviewer.login,
        avatarUrl: reviewer.avatar_url ?? null,
      })),
      assignees: (pr.assignees ?? []).map((assignee) => ({
        login: assignee.login,
        avatarUrl: assignee.avatar_url ?? null,
      })),
      checks: [...checkRuns, ...statusChecks],
      checksTruncated: checksRes.data.total_count > MAX_CHECKS,
      comments,
      commentsTruncated:
        issueRes.data.length >= MAX_ISSUE_COMMENTS ||
        reviewCommentRes.data.length >= MAX_REVIEW_COMMENTS,
    };
  },
});

// V3: payload gained `reviewEvents` and per-comment `reviewId` for the
// conversation timeline — a bumped name drops V2 entries instead of serving
// objects that are missing the new fields.
const prOverviewCache = new ActionCache(components.actionCache, {
  action: internal._github.prOverview.fetchPullRequestOverview,
  name: "prOverviewV3",
  ttl: PR_OVERVIEW_CACHE_TTL_MS,
});

/**
 * Everything the Reviews Overview tab shows: description, conversation,
 * checks and commit statuses, reviews, commits, and mergeability. Soft-capped
 * to keep action payloads bounded. ActionCache-backed (60s TTL); pass `force`
 * to bypass (Retry, and after a merge).
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

/**
 * Merges a pull request from the Overview tab. GitHub rejects the call when the
 * PR is not mergeable, so the thrown message is surfaced to the user as-is
 * rather than being second-guessed here.
 */
export const mergePullRequest = action({
  args: {
    repoId: v.id("githubRepos"),
    prNumber: v.number(),
    method: v.union(
      v.literal("merge"),
      v.literal("squash"),
      v.literal("rebase"),
    ),
  },
  returns: v.object({
    merged: v.boolean(),
    sha: v.union(v.string(), v.null()),
    message: v.string(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ merged: boolean; sha: string | null; message: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });
    if (!repo) throw new Error("Repo not found");

    const octokit = await getInstallationOctokit(repo.installationId);
    const { data } = await octokit.rest.pulls.merge({
      owner: repo.owner,
      repo: repo.name,
      pull_number: args.prNumber,
      merge_method: args.method,
    });

    return {
      merged: data.merged,
      sha: data.sha ?? null,
      message: data.message,
    };
  },
});
