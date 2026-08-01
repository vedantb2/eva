import { IconClock } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { OverviewCard } from "./OverviewCard";
import {
  ReviewStateIcon,
  reviewStateMeta,
  type PrOverview,
} from "./prOverviewMeta";

function Person({
  login,
  avatarUrl,
}: {
  login: string;
  avatarUrl: string | null;
}) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-4 shrink-0 rounded-full" />
      ) : null}
      <span className="min-w-0 truncate text-sm">{login}</span>
    </span>
  );
}

/**
 * Who has signed off and who still owes a review. Reviews arrive collapsed to
 * the latest decisive state per reviewer, so bot reviewers appear here exactly
 * as they do on GitHub.
 */
export function PrReviewersCard({
  reviews,
  requestedReviewers,
  assignees,
}: {
  reviews: PrOverview["reviews"];
  requestedReviewers: PrOverview["requestedReviewers"];
  assignees: PrOverview["assignees"];
}) {
  const total = reviews.length + requestedReviewers.length;

  return (
    <OverviewCard
      title="Reviewers"
      count={total}
      footer={
        assignees.length > 0
          ? `Assigned to ${assignees.map((a) => a.login).join(", ")}`
          : undefined
      }
    >
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reviewers requested yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1"
            >
              <Person
                login={review.authorLogin}
                avatarUrl={review.authorAvatarUrl}
              />
              <a
                href={review.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ReviewStateIcon state={review.state} />
                {reviewStateMeta(review.state).label}
                {review.submittedAt ? (
                  <RelativeDateTime
                    at={new Date(review.submittedAt).getTime()}
                  />
                ) : null}
              </a>
            </li>
          ))}
          {requestedReviewers.map((reviewer) => (
            <li
              key={`requested-${reviewer.login}`}
              className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1"
            >
              <Person login={reviewer.login} avatarUrl={reviewer.avatarUrl} />
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                <IconClock className="size-3.5" />
                Awaiting review
              </span>
            </li>
          ))}
        </ul>
      )}
    </OverviewCard>
  );
}
