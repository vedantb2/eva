"use client";

import { useState } from "react";
import type { Id } from "@eva/backend";
import { Button, Spinner, Textarea, cn } from "@eva/ui";
import {
  IconChevronRight,
  IconExternalLink,
  IconPencil,
} from "@tabler/icons-react";
import { Streamdown } from "streamdown";
import { usePrEdit } from "../usePrEdit";
import { MARKDOWN_CLASS, type PrOverview } from "./prOverviewMeta";

/**
 * The pull request description, as its own collapsible section above the
 * conversation rather than the first bubble inside it.
 *
 * eva's agents write long descriptions, and as a timeline row that pushed every
 * human comment below the fold — the thing a reviewer came to read was the thing
 * hardest to reach. Collapsing it here puts the choice with the reader.
 *
 * One piece of state holds both halves of the editor: a string is the draft being
 * written, `null` means the description is being read rather than edited.
 */
export function PrDescriptionSection({
  repoId,
  overview,
}: {
  repoId: Id<"githubRepos">;
  overview: PrOverview;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  // Saving patches the query caches, so the section re-reads the new description
  // as soon as the editor closes — nothing here has to hold the saved text.
  const edit = usePrEdit(repoId, overview.number, () => setDraft(null));

  const body = overview.body ?? "";
  const hasBody = body.trim().length > 0;

  if (draft !== null) {
    return (
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground">
          Edit description
        </div>

        <div className="space-y-3 p-3">
          <Textarea
            className="min-h-40 text-sm"
            value={draft}
            placeholder="Describe this pull request"
            aria-label="Pull request description"
            onChange={(event) => setDraft(event.target.value)}
          />

          {edit.error === null ? null : (
            <p className="text-xs text-destructive">{edit.error}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* eva authenticates as its GitHub App, so the edit is attributed to
                the app rather than to the reader's account. */}
            <p className="text-xs text-muted-foreground">
              Saved to GitHub as the eva app.
            </p>
            <span className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDraft(null)}
                disabled={edit.saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => edit.save({ body: draft })}
                disabled={edit.saving}
              >
                {edit.saving ? <Spinner size="sm" /> : null}
                Save
              </Button>
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="motion-press flex min-w-0 items-center gap-1.5 font-medium text-foreground active:scale-[0.98]"
        >
          <IconChevronRight
            size={13}
            aria-hidden
            className={cn("shrink-0 transition-transform", open && "rotate-90")}
          />
          Description
        </button>

        <span className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-foreground"
            onClick={() => setDraft(body)}
          >
            <IconPencil size={12} aria-hidden />
            Edit
          </button>
          <a
            href={overview.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
            aria-label="View on GitHub"
          >
            <IconExternalLink size={12} aria-hidden />
          </a>
        </span>
      </div>

      {open ? (
        <div className="px-3 py-2.5">
          {hasBody ? (
            <Streamdown className={MARKDOWN_CLASS}>{body}</Streamdown>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No description provided.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
