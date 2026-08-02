"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { cn, Skeleton, STREAMDOWN_TABLE_RADIUS_CLASS } from "@eva/ui";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { IconSparkles } from "@tabler/icons-react";
import dayjs from "dayjs";
import { PageWrapper } from "@/lib/components/PageWrapper";

/** Same plugin set as `ChangelogDialog`, so both surfaces render identically. */
const changelogPlugins = { cjk, math, mermaid };

/**
 * Every published entry of the "Eva Weekly Changelog" automation as a timeline.
 * The dialog shows only the newest one; this is the full archive.
 */
export function ChangelogClient() {
  const entries = useQuery(api.changelog.listChangelog);

  return (
    <PageWrapper title="Changelog" comfortable>
      {entries === undefined ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 border border-border" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-surface border border-border bg-card py-16 text-center">
          <IconSparkles size={20} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No changelog entries yet.
          </p>
        </div>
      ) : (
        // The rail is drawn on the list, not per entry, so it runs unbroken
        // between cards instead of restarting at each one.
        <ol className="relative space-y-4 border-l border-border pl-6 sm:pl-8">
          {entries.map((entry, index) => (
            <li key={entry.id} className="relative">
              <span
                className={cn(
                  "absolute -left-6 top-4 size-2 rounded-full ring-4 ring-background sm:-left-8",
                  index === 0 ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
              <article className="rounded-surface border border-border bg-card">
                <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <h2 className="text-sm font-semibold">
                    Week of {dayjs(entry.publishedAt).format("MMM D, YYYY")}
                  </h2>
                  {index === 0 ? (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Latest
                    </span>
                  ) : null}
                </header>
                <div className="px-4 py-3">
                  <Streamdown
                    className={cn(
                      "text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
                      STREAMDOWN_TABLE_RADIUS_CLASS,
                    )}
                    plugins={changelogPlugins}
                  >
                    {entry.content}
                  </Streamdown>
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </PageWrapper>
  );
}
