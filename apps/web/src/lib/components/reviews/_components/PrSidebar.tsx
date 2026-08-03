import type { ReactNode } from "react";
import { Badge } from "@eva/ui";
import { IconClock } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import {
  ReviewStateIcon,
  reviewStateMeta,
  type PrActor,
  type PrLabel,
  type PrOverview,
} from "./prOverviewMeta";

/**
 * The properties rail: who is reviewing, who owns the change, how it is
 * labelled. Label on the left, value stacked on the right — one row per
 * property, no cards and no dividers, so the rail stays quieter than the
 * conversation it sits beside and does not compete with the merge box.
 */
export function PrSidebar({ overview }: { overview: PrOverview }) {
  return (
    <div className="min-w-0 space-y-3">
      <PropertyRow label="Reviewers">
        {overview.reviews.length + overview.requestedReviewers.length === 0 ? (
          <Empty>No reviewers requested.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {overview.reviews.map((review) => (
              <li key={review.id} className="flex min-w-0 items-center gap-2">
                <Person
                  login={review.authorLogin}
                  avatarUrl={review.authorAvatarUrl}
                />
                <a
                  href={review.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex shrink-0 items-center gap-1 text-2xs text-muted-foreground hover:text-foreground"
                  title={reviewStateMeta(review.state).label}
                >
                  <ReviewStateIcon state={review.state} />
                  {review.submittedAt ? (
                    <RelativeDateTime
                      at={new Date(review.submittedAt).getTime()}
                    />
                  ) : null}
                </a>
              </li>
            ))}
            {overview.requestedReviewers.map((reviewer) => (
              <li
                key={`requested-${reviewer.login}`}
                className="flex min-w-0 items-center gap-2"
              >
                <Person login={reviewer.login} avatarUrl={reviewer.avatarUrl} />
                <span className="ml-auto flex shrink-0 items-center gap-1 text-2xs text-muted-foreground">
                  <IconClock size={13} aria-hidden />
                  Awaiting
                </span>
              </li>
            ))}
          </ul>
        )}
      </PropertyRow>

      <PropertyRow label="Assignees">
        {overview.assignees.length === 0 ? (
          <Empty>No one assigned.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {overview.assignees.map((assignee) => (
              <li key={assignee.login}>
                <Person
                  login={assignee.login}
                  avatarUrl={assignee.avatarUrl}
                />
              </li>
            ))}
          </ul>
        )}
      </PropertyRow>

      <PropertyRow label="Labels">
        {overview.labels.length === 0 ? (
          <Empty>None yet.</Empty>
        ) : (
          <div className="flex flex-wrap gap-1">
            {overview.labels.map((label) => (
              <LabelChip key={label.name} label={label} />
            ))}
          </div>
        )}
      </PropertyRow>
    </div>
  );
}

/**
 * One label/value property row. The label column is fixed so every value in the
 * rail starts on the same vertical line, and `items-start` keeps the label
 * aligned to the first value when the value wraps to several lines.
 */
function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-2">
      <h3 className="pt-0.5 text-xs font-normal text-muted-foreground">
        {label}
      </h3>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="pt-0.5 text-xs text-muted-foreground/70">{children}</p>;
}

function Person({ login, avatarUrl }: PrActor) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-5 shrink-0 rounded-full" />
      ) : (
        <span className="size-5 shrink-0 rounded-full border border-border bg-muted" />
      )}
      <span className="min-w-0 truncate text-2sm">{login}</span>
    </span>
  );
}

function LabelChip({ label }: { label: PrLabel }) {
  return (
    <Badge variant="quiet" className="min-w-0 gap-1.5 font-normal">
      {/* Label colours come from GitHub as data, so they cannot be theme
          tokens; keep them to a dot so contrast stays safe in both themes. */}
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: `#${label.color}` }}
      />
      {label.name}
    </Badge>
  );
}
