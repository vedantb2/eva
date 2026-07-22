"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { getInstallationOctokit } from "../githubAuth";
import type { Id } from "../_generated/dataModel";

const MAX_LIST_PAGES = 3;
const MAX_ISSUE_COMMENTS = 100;
const MAX_REVIEW_COMMENTS = 100;

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

type PullRequestOverview = {
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  body: string | null;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  comments: PullRequestComment[];
  commentsTruncated: boolean;
};

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
 * PR description plus issue comments and review comments for the Reviews
 * Overview tab. Soft-capped to keep action payloads bounded.
 */
export const getPullRequestOverview = action({
  args: {
    repoId: v.id("githubRepos"),
    prNumber: v.number(),
  },
  returns: v.object({
    number: v.number(),
    title: v.string(),
    state: v.union(v.literal("open"), v.literal("closed")),
    draft: v.boolean(),
    body: v.union(v.string(), v.null()),
    authorLogin: v.union(v.string(), v.null()),
    authorAvatarUrl: v.union(v.string(), v.null()),
    htmlUrl: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    comments: v.array(pullRequestCommentValidator),
    commentsTruncated: v.boolean(),
  }),
  handler: async (ctx, args): Promise<PullRequestOverview> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

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

    const issueRes = await octokit.rest.issues.listComments({
      owner: repo.owner,
      repo: repo.name,
      issue_number: args.prNumber,
      per_page: MAX_ISSUE_COMMENTS,
    });
    const reviewRes = await octokit.rest.pulls.listReviewComments({
      owner: repo.owner,
      repo: repo.name,
      pull_number: args.prNumber,
      per_page: MAX_REVIEW_COMMENTS,
    });

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
      state: pr.state === "open" ? "open" : "closed",
      draft: pr.draft === true,
      body: pr.body ?? null,
      authorLogin: pr.user?.login ?? null,
      authorAvatarUrl: pr.user?.avatar_url ?? null,
      htmlUrl: pr.html_url,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      comments,
      commentsTruncated:
        issueRes.data.length >= MAX_ISSUE_COMMENTS ||
        reviewRes.data.length >= MAX_REVIEW_COMMENTS,
    };
  },
});
