import type { ReactNode } from "react";
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
 * The metadata column: who is reviewing, who owns the change, how it is
 * labelled. Deliberately border-only dividers and no card — GitHub keeps this
 * column visually quieter than the conversation it sits beside, and a card here
 * would compete with the merge box for attention.
 */
export function PrSidebar({ overview }: { overview: PrOverview }) {
  return (
    <div className="min-w-0 divide-y divide-border">
      <Section title="Reviewers">
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
                  className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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
                <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <IconClock size={13} aria-hidden />
                  Awaiting
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Assignees">
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
      </Section>

      <Section title="Labels">
        {overview.labels.length === 0 ? (
          <Empty>None yet.</Empty>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {overview.labels.map((label) => (
              <LabelChip key={label.name} label={label} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 py-3 first:pt-0 last:pb-0">
      <h3 className="mb-2 text-xs font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function Person({ login, avatarUrl }: PrActor) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-5 shrink-0 rounded-full" />
      ) : (
        <span className="size-5 shrink-0 rounded-full border border-border bg-muted" />
      )}
      <span className="min-w-0 truncate text-sm">{login}</span>
    </span>
  );
}

function LabelChip({ label }: { label: PrLabel }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground">
      {/* Label colours come from GitHub as data, so they cannot be theme
          tokens; keep them to a dot so contrast stays safe in both themes. */}
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: `#${label.color}` }}
      />
      {label.name}
    </span>
  );
}
