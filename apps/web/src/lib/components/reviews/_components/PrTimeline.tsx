"use client";

import type { ReactNode } from "react";
import { IconGitCommit } from "@tabler/icons-react";
import { PrCommentBubble } from "./PrCommentBubble";
import { PrCommitGroup } from "./PrCommitGroup";
import { PrReviewEventItem } from "./PrReviewEventItem";
import {
  NOTICE_CLASS,
  ReviewStateIcon,
  type PrOverview,
} from "./prOverviewMeta";
import { buildPrTimeline } from "./prTimelineItems";

/**
 * The conversation: the description, then everything that happened to the pull
 * request in order. The vertical rail and the 32px gutter are owned here, so
 * comments, review verdicts, and commits all line up however they are composed.
 */
export function PrTimeline({ overview }: { overview: PrOverview }) {
  const items = buildPrTimeline(overview);
  // Any dropped page makes the timeline incomplete, and a reviewer reading it as
  // the whole story is the failure mode worth spending a line of copy on.
  const truncated =
    overview.commentsTruncated ||
    overview.commitsTruncated ||
    overview.commitCount > overview.commits.length;

  return (
    <div className="relative min-w-0 space-y-3">
      <span
        aria-hidden
        className="absolute inset-y-4 left-4 w-px bg-border"
        // The rail is decoration behind the gutter; every avatar masks it with a
        // background ring so it reads as a thread rather than a strikethrough.
      />

      <ol className="relative flex min-w-0 flex-col gap-4">
        <TimelineRow
          gutter={
            <TimelineAvatar
              login={overview.authorLogin}
              avatarUrl={overview.authorAvatarUrl}
            />
          }
        >
          <PrCommentBubble
            authorLogin={overview.authorLogin}
            action="opened this pull request"
            at={overview.createdAt}
            htmlUrl={overview.htmlUrl}
            body={overview.body ?? ""}
          />
        </TimelineRow>

        {items.map((item) => {
          if (item.kind === "commits") {
            return (
              <TimelineRow
                key={item.key}
                gutter={
                  <span className="flex size-8 items-center justify-center">
                    <span className="flex size-6 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground ring-2 ring-background">
                      <IconGitCommit size={13} aria-hidden />
                    </span>
                  </span>
                }
              >
                <PrCommitGroup commits={item.commits} />
              </TimelineRow>
            );
          }

          if (item.kind === "review") {
            return (
              <TimelineRow
                key={item.key}
                gutter={
                  <span className="relative flex size-8">
                    <TimelineAvatar
                      login={item.review.authorLogin}
                      avatarUrl={item.review.authorAvatarUrl}
                    />
                    <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-background">
                      <ReviewStateIcon state={item.review.state} />
                    </span>
                  </span>
                }
              >
                <PrReviewEventItem item={item} />
              </TimelineRow>
            );
          }

          return (
            <TimelineRow
              key={item.key}
              gutter={
                <TimelineAvatar
                  login={item.comment.authorLogin}
                  avatarUrl={item.comment.authorAvatarUrl}
                />
              }
            >
              <PrCommentBubble
                authorLogin={item.comment.authorLogin}
                action={item.comment.path ? "commented on" : "commented"}
                at={item.comment.createdAt}
                htmlUrl={item.comment.htmlUrl}
                body={item.comment.body}
                path={item.comment.path}
                line={item.comment.line}
              />
            </TimelineRow>
          );
        })}
      </ol>

      {truncated ? (
        <p className={NOTICE_CLASS}>
          Older items are not shown.{" "}
          <a
            href={overview.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            View the full conversation on GitHub
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}

function TimelineRow({
  gutter,
  children,
}: {
  gutter: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="relative flex min-w-0 gap-3">
      <span className="relative z-[1] shrink-0">{gutter}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

function TimelineAvatar({
  login,
  avatarUrl,
}: {
  login: string | null;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="size-8 shrink-0 rounded-full ring-2 ring-background"
      />
    );
  }
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-medium uppercase text-muted-foreground ring-2 ring-background">
      {login === null ? "?" : login.slice(0, 2)}
    </span>
  );
}
