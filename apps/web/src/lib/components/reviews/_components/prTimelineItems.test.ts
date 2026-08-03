import { describe, expect, test } from "vitest";
import { buildPrTimeline } from "./prTimelineItems";
import type { PrComment, PrCommit, PrOverview, PrReviewEvent } from "./prOverviewMeta";

/** Every field `pullRequestOverviewValidator` requires, filled with a neutral default. */
const BASE_OVERVIEW: PrOverview = {
  number: 1,
  title: "Add feature",
  status: "open",
  draft: false,
  body: null,
  authorLogin: "octocat",
  authorAvatarUrl: null,
  htmlUrl: "https://github.com/eva/eva/pull/1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  headRef: "feature",
  baseRef: "main",
  headSha: "headsha",
  changedFiles: 1,
  additions: 1,
  deletions: 0,
  commitCount: 0,
  commits: [],
  commitsTruncated: false,
  mergeable: true,
  mergeableState: "clean",
  mergedAt: null,
  mergedByLogin: null,
  labels: [],
  reviews: [],
  reviewEvents: [],
  requestedReviewers: [],
  assignees: [],
  checks: [],
  checksTruncated: false,
  comments: [],
  commentsTruncated: false,
};

const BASE_COMMIT: PrCommit = {
  sha: "sha0",
  message: "Initial commit",
  authorLogin: "octocat",
  authorAvatarUrl: null,
  committedAt: "2026-01-01T00:00:00.000Z",
  htmlUrl: "https://github.com/eva/eva/commit/sha0",
};

const BASE_REVIEW_EVENT: PrReviewEvent = {
  id: 0,
  authorLogin: "reviewer",
  authorAvatarUrl: null,
  state: "COMMENTED",
  submittedAt: "2026-01-01T00:00:00.000Z",
  htmlUrl: "https://github.com/eva/eva/pull/1#pullrequestreview-0",
  body: "",
};

const BASE_COMMENT: PrComment = {
  id: 0,
  kind: "issue",
  body: "Comment body",
  authorLogin: "commenter",
  authorAvatarUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  htmlUrl: "https://github.com/eva/eva/pull/1#issuecomment-0",
};

function overview(partial: Partial<PrOverview>): PrOverview {
  return { ...BASE_OVERVIEW, ...partial };
}

function commit(partial: Partial<PrCommit>): PrCommit {
  return { ...BASE_COMMIT, ...partial };
}

function reviewEvent(partial: Partial<PrReviewEvent>): PrReviewEvent {
  return { ...BASE_REVIEW_EVENT, ...partial };
}

function comment(partial: Partial<PrComment>): PrComment {
  return { ...BASE_COMMENT, ...partial };
}

/** Timestamp helper — the timeline only cares about relative order, not real dates. */
function at(ms: number): string {
  return new Date(ms).toISOString();
}

describe("buildPrTimeline", () => {
  test("orders commits, reviews and comments ascending, tying on commit-review-comment", () => {
    const commitAtOne = commit({ sha: "commitB", committedAt: at(1000) });
    const reviewAtOne = reviewEvent({
      id: 1,
      submittedAt: at(1000),
      state: "COMMENTED",
      body: "nice",
    });
    const commentAtOne = comment({
      id: 50,
      kind: "issue",
      createdAt: at(1000),
    });
    const reviewAtTwo = reviewEvent({
      id: 2,
      submittedAt: at(2000),
      state: "APPROVED",
      body: "",
    });
    const commitAtThree = commit({ sha: "commitA", committedAt: at(3000) });
    const commentAtFour = comment({
      id: 60,
      kind: "review",
      reviewId: null,
      createdAt: at(4000),
    });

    const timeline = buildPrTimeline(
      overview({
        commits: [commitAtThree, commitAtOne],
        reviewEvents: [reviewAtTwo, reviewAtOne],
        comments: [commentAtFour, commentAtOne],
      }),
    );

    expect(timeline.map((item) => item.key)).toEqual([
      "commits-commitB",
      "review-1",
      "comment-issue-50",
      "review-2",
      "commits-commitA",
      "comment-review-60",
    ]);
  });

  test("groups adjacent commits, and splits the run on anything said between", () => {
    const first = commit({ sha: "one", committedAt: at(1000) });
    const second = commit({ sha: "two", committedAt: at(2000) });
    const spoken = comment({ id: 70, kind: "issue", createdAt: at(3000) });
    const third = commit({ sha: "three", committedAt: at(4000) });

    const timeline = buildPrTimeline(
      overview({
        commits: [first, second, third],
        comments: [spoken],
      }),
    );

    expect(timeline.map((item) => item.kind)).toEqual([
      "commits",
      "comment",
      "commits",
    ]);

    const [group] = timeline;
    if (group?.kind !== "commits") throw new Error("Expected a commits group");
    expect(group.commits).toEqual([first, second]);
  });

  test("nests a review comment under its review; an unmatched reviewId stands alone", () => {
    const attachedReview = reviewEvent({
      id: 10,
      submittedAt: at(1000),
      state: "APPROVED",
      body: "lgtm",
    });
    const attachedComment = comment({
      id: 200,
      kind: "review",
      createdAt: at(999),
      reviewId: 10,
    });
    const standaloneNullReview = comment({
      id: 201,
      kind: "issue",
      createdAt: at(1500),
      reviewId: null,
    });
    const standaloneUnmatchedReview = comment({
      id: 202,
      kind: "review",
      createdAt: at(1600),
      reviewId: 999,
    });

    const timeline = buildPrTimeline(
      overview({
        reviewEvents: [attachedReview],
        comments: [
          attachedComment,
          standaloneNullReview,
          standaloneUnmatchedReview,
        ],
      }),
    );

    const reviewItem = timeline.find((item) => item.kind === "review");
    expect(reviewItem?.kind).toBe("review");
    if (reviewItem?.kind !== "review") {
      throw new Error("Expected a review item");
    }
    expect(reviewItem.comments).toEqual([attachedComment]);

    const commentItems = timeline.filter((item) => item.kind === "comment");
    expect(commentItems.map((item) => item.key)).toEqual([
      "comment-issue-201",
      "comment-review-202",
    ]);
    // The attached comment is nested under the review, never standalone.
    expect(
      commentItems.some(
        (item) => item.kind === "comment" && item.comment.id === 200,
      ),
    ).toBe(false);
  });

  test("drops an empty COMMENTED shell but keeps one with a comment or a body", () => {
    const emptyShell = reviewEvent({
      id: 1,
      submittedAt: at(500),
      state: "COMMENTED",
      body: "",
    });
    const emptyBodyWithComment = reviewEvent({
      id: 2,
      submittedAt: at(1000),
      state: "COMMENTED",
      body: "",
    });
    const attachedComment = comment({
      id: 300,
      kind: "review",
      createdAt: at(900),
      reviewId: 2,
    });
    const nonBlankBody = reviewEvent({
      id: 3,
      submittedAt: at(2000),
      state: "COMMENTED",
      body: "looks fine",
    });

    const timeline = buildPrTimeline(
      overview({
        reviewEvents: [emptyShell, emptyBodyWithComment, nonBlankBody],
        comments: [attachedComment],
      }),
    );

    expect(timeline.map((item) => item.key)).toEqual([
      "review-2",
      "review-3",
    ]);
  });
});
