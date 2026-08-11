import type { ReactNode } from "react";
import { IconClock } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import {
  ReviewStateIcon,
  SECTION_LABEL_CLASS,
  reviewStateMeta,
  type PrActor,
  type PrLabel,
  type PrOverview,
} from "./prOverviewMeta";

/**
 * The metadata column: who is reviewing, who owns the change, how it is
 * labelled — GitHub's own furniture, in GitHub's own order, because that is
 * where a reviewer already looks for it.
 *
 * Headings and whitespace only: no card, no rules between sections. This column
 * is reference material beside the conversation, so it must not compete with the
 * merge control for the one piece of attention on the surface.
 *
 * Reviewers, Assignees, and Labels always render, empty or not — the structure
 * is the point, and a reader should be able to tell "nobody is reviewing" from
 * "I am looking in the wrong place". What is empty says so in one word rather
 * than the sentence it used to spend ("No reviewers requested.").
 */
export function PrMetaSidebar({ overview }: { overview: PrOverview }) {
  const reviewers =
    overview.reviews.length + overview.requestedReviewers.length;

  return (
    // Sections sit side by side while this is a full-width band above the
    // conversation, and stack once the panel is wide enough to give them a
    // column of their own.
    <aside className="flex w-full shrink-0 flex-wrap gap-x-8 gap-y-4 [@container(min-width:52rem)]:w-56 [@container(min-width:52rem)]:flex-col [@container(min-width:52rem)]:gap-6">
      <Section title="Reviewers">
        {reviewers === 0 ? (
          <Empty />
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
                <span
                  className="ml-auto shrink-0 text-muted-foreground"
                  title="Awaiting review"
                >
                  <IconClock size={13} aria-hidden />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Assignees">
        {overview.assignees.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-1.5">
            {overview.assignees.map((assignee) => (
              <li key={assignee.login} className="min-w-0">
                <Person login={assignee.login} avatarUrl={assignee.avatarUrl} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Labels">
        {overview.labels.length === 0 ? (
          <Empty />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {overview.labels.map((label) => (
              <LabelChip key={label.name} label={label} />
            ))}
          </div>
        )}
      </Section>

      {overview.comments.length === 0 ? null : (
        <Section title="Comments">
          <span className="text-xs text-muted-foreground">
            <span className="tabular-nums text-foreground">
              {overview.comments.length}
            </span>{" "}
            {overview.comments.length === 1 ? "comment" : "comments"}
          </span>
        </Section>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 space-y-1.5">
      <h2 className={SECTION_LABEL_CLASS}>{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-xs text-muted-foreground">None</p>;
}

function Person({ login, avatarUrl }: PrActor) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="size-4 shrink-0 rounded-full" />
      ) : (
        <span className="size-4 shrink-0 rounded-full bg-muted" />
      )}
      <span className="min-w-0 truncate">{login}</span>
    </span>
  );
}

function LabelChip({ label }: { label: PrLabel }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-muted/60 px-1.5 py-0.5 text-xs">
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
