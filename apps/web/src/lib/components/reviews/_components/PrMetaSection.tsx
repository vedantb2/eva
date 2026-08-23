import type { ReactNode } from "react";
import { SECTION_LABEL_CLASS } from "./prOverviewMeta";

/**
 * One region of the metadata column: a heading, an optional control on the same
 * line, and whatever the section holds.
 *
 * Two ways to say "nothing here". A section whose body is a list renders `empty`
 * on the heading row — "Assignees  No one" is one line where a heading over the
 * word "None" is two, and this column has five of them. A section with a body
 * worth reading puts it below.
 *
 * The control sits on the heading, not floating over the body, so a reader can
 * tell at a glance which sections they are allowed to change.
 */
export function PrMetaSection({
  title,
  empty,
  action,
  children,
}: {
  title: string;
  /**
   * Rendered beside the heading instead of `children` — pass this when the
   * section has nothing in it.
   */
  empty?: string;
  /** An icon control (edit, refresh) on the heading row. */
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className={SECTION_LABEL_CLASS}>{title}</h2>
        {empty === undefined ? null : (
          <span className="min-w-0 truncate text-xs text-muted-foreground/70">
            {empty}
          </span>
        )}
        {action === undefined ? null : (
          // Held back until the reader is in the column: five permanently visible
          // pencils read as chrome to skip past rather than as an invitation.
          // Shipped visible below `sm`, where there is no hover to reveal them.
          <span className="reveal-on-hover transition-opacity ml-auto flex shrink-0 items-center">
            {action}
          </span>
        )}
      </div>
      {empty === undefined ? children : null}
    </section>
  );
}
