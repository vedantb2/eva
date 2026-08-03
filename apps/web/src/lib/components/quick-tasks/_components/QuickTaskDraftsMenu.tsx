"use client";

import { useState } from "react";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@eva/ui";
import { IconFileText, IconTrash } from "@tabler/icons-react";
import type { api, Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";

type QuickTaskDraft = FunctionReturnType<
  typeof api.agentTasks.listDrafts
>[number];

interface QuickTaskDraftsMenuProps {
  drafts: QuickTaskDraft[];
  onLoadDraft: (draft: QuickTaskDraft) => void;
  onDeleteDraft: (id: Id<"agentTasks">) => void;
}

/**
 * Saved-drafts popover for the quick-task modal. Owns the inline
 * delete confirmation, which is local to this menu and never read by the form.
 * Each row is a real button plus a sibling delete button, so keyboard
 * activation comes from the platform instead of a hand-rolled role/tabIndex.
 */
export function QuickTaskDraftsMenu({
  drafts,
  onLoadDraft,
  onDeleteDraft,
}: QuickTaskDraftsMenuProps) {
  const [confirmDeleteId, setConfirmDeleteId] =
    useState<Id<"agentTasks"> | null>(null);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <IconFileText size={14} />
          Drafts ({drafts.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="border-b border-border px-3 py-2">
          <p className="text-2sm font-medium">Saved drafts</p>
        </div>
        <div className="scrollbar max-h-56 overflow-y-auto p-1">
          {drafts.map((draft) =>
            confirmDeleteId === draft._id ? (
              <div
                key={draft._id}
                className="flex items-center justify-between gap-2 rounded-menu-item bg-destructive/5 px-2 py-1.5 text-2sm"
              >
                <span className="truncate text-destructive">Delete draft?</span>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => {
                      setConfirmDeleteId(null);
                      onDeleteDraft(draft._id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={draft._id}
                className="group flex items-center gap-1 rounded-menu-item pr-1 transition-colors hover:bg-muted"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-w-0 flex-1 justify-start px-2 text-2sm font-normal hover:bg-transparent"
                  onClick={() => onLoadDraft(draft)}
                >
                  <span className="truncate">
                    {draft.title || (
                      <span className="italic text-muted-foreground">
                        Untitled
                      </span>
                    )}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete draft"
                  onClick={() => setConfirmDeleteId(draft._id)}
                >
                  <IconTrash />
                </Button>
              </div>
            ),
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
