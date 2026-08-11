"use client";

import { useState } from "react";
import type { Id } from "@eva/backend";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Spinner,
  Surface,
  Textarea,
  cn,
} from "@eva/ui";
import {
  IconChevronRight,
  IconExternalLink,
  IconPencil,
} from "@tabler/icons-react";
import { Streamdown } from "streamdown";
import { usePrEdit } from "../usePrEdit";
import {
  MARKDOWN_CLASS,
  SECTION_LABEL_CLASS,
  type PrOverview,
} from "./prOverviewMeta";

/**
 * The pull request description, as its own collapsible region above the
 * conversation rather than the first bubble inside it.
 *
 * eva's agents write long descriptions, and as a timeline row that pushed every
 * human comment below the fold — the thing a reviewer came to read was the thing
 * hardest to reach. Collapsing it here puts the choice with the reader.
 *
 * A label and whitespace, not a card: this is the body copy of the page, and a box
 * around body copy makes the page look like a form. Edit and the GitHub link only
 * appear on hover or focus, so the resting state is the heading and the prose.
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
      <section className="space-y-2">
        <p className={SECTION_LABEL_CLASS}>Edit description</p>

        <Surface density="tight" className="space-y-3">
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
        </Surface>
      </section>
    );
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/description space-y-2"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {/* The house Collapsible, not Accordion: an accordion item carries a
            bottom rule and a row-height trigger, which is the wrong register for
            one region of body copy — and this way the panel animates its measured
            height (`t-collapsible-content`) instead of snapping. */}
        <CollapsibleTrigger
          className={cn(
            SECTION_LABEL_CLASS,
            "motion-press flex min-w-0 items-center gap-1.5 hover:text-foreground active:scale-[0.98] [&[data-state=open]>svg]:rotate-90",
          )}
        >
          <IconChevronRight
            size={13}
            aria-hidden
            // Same duration as the panel, so glyph and content settle together.
            className="shrink-0 transition-transform duration-[var(--motion-base)]"
          />
          Description
        </CollapsibleTrigger>

        {/* Held back until the reader is in this region: two controls sitting
            permanently beside a heading read as chrome to skip past. */}
        <span className="ml-auto flex shrink-0 items-center gap-3 text-xs text-muted-foreground opacity-0 transition-opacity focus-within:opacity-100 group-hover/description:opacity-100">
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

      <CollapsibleContent>
        {hasBody ? (
          <Streamdown className={MARKDOWN_CLASS}>{body}</Streamdown>
        ) : (
          <p className="text-sm text-muted-foreground">
            No description yet. Add one to say what changed and why.
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
