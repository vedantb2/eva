"use client";

import { useState } from "react";
import type { Id } from "@eva/backend";
import { Button, Spinner, Textarea } from "@eva/ui";
import { IconPencil } from "@tabler/icons-react";
import { usePrEdit } from "../usePrEdit";
import { PrCommentBubble } from "./PrCommentBubble";
import type { PrOverview } from "./prOverviewMeta";

/**
 * The pull request description, with GitHub's Edit affordance. One piece of state
 * holds both halves of the editor: a string is the draft being written, `null`
 * means the description is being read rather than edited.
 */
export function PrDescriptionBubble({
  repoId,
  overview,
}: {
  repoId: Id<"githubRepos">;
  overview: PrOverview;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  // Saving patches the query caches, so the bubble re-reads the new description
  // as soon as the editor closes — nothing here has to hold the saved text.
  const edit = usePrEdit(repoId, overview.number, () => setDraft(null));

  if (draft === null) {
    return (
      <PrCommentBubble
        authorLogin={overview.authorLogin}
        action="opened this pull request"
        at={overview.createdAt}
        htmlUrl={overview.htmlUrl}
        body={overview.body ?? ""}
        actions={
          <Button
            size="xs"
            variant="ghost"
            className="h-6 gap-1 px-1.5 text-muted-foreground"
            onClick={() => setDraft(overview.body ?? "")}
          >
            <IconPencil size={12} aria-hidden />
            Edit
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-surface border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground">
        Edit description
      </div>

      <div className="space-y-3 p-3">
        <Textarea
          className="min-h-40 text-2sm"
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
    </div>
  );
}
