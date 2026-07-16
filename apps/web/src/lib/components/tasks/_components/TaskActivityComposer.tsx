"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { CommentMentionInput } from "./CommentMentionInput";
import { CommentSendButton } from "./CommentSendButton";
import { TaskActivityComposerForm } from "./TaskActivityComposerForm";

interface TaskActivityComposerProps {
  taskId: Id<"agentTasks">;
  isProjectTask: boolean;
  requestingChanges: boolean;
  setRequestingChanges: (value: boolean) => void;
  executionError: string | null;
  setExecutionError: (value: string | null) => void;
  requestChangesBlockedReason: string | undefined;
  onRequestChangesSubmitted: () => void;
}

// ---------------------------------------------------------------------------
// Outer shell — loads the draft, shows a disabled editor while loading,
// mounts the inner form exactly once when the draft resolves.
// ---------------------------------------------------------------------------

/** Comment / request-changes input pinned below the task activity timeline. */
export function TaskActivityComposer({
  taskId,
  isProjectTask,
  requestingChanges,
  setRequestingChanges,
  executionError,
  setExecutionError,
  requestChangesBlockedReason,
  onRequestChangesSubmitted,
}: TaskActivityComposerProps) {
  const draft = useQuery(api.drafts.getForTarget, {
    target: { kind: "taskComment", taskId },
  });

  const editorClassName =
    "min-h-9 max-h-44 rounded-none border-0 bg-transparent px-3 py-2.5 shadow-none focus-visible:ring-0 transition-[background-color]";

  // While draft is undefined (query not yet resolved), show a disabled
  // placeholder using the same chrome so layout doesn't shift.
  if (draft === undefined) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-surface border border-input bg-card">
          <CommentMentionInput
            value=""
            onValueChange={() => undefined}
            placeholder="Add a comment..."
            disabled
            className={editorClassName}
          />
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <span className="flex items-center gap-2">
              <span className="relative h-6 w-10 shrink-0 rounded-full bg-muted" />
              <span className="text-xs select-none text-muted-foreground">
                Make changes
              </span>
            </span>
            <CommentSendButton
              size="icon-sm"
              disabled
              isSubmitting={false}
              onClick={() => undefined}
              ariaLabel="Add comment"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <TaskActivityComposerForm
      key="ready"
      taskId={taskId}
      isProjectTask={isProjectTask}
      requestingChanges={requestingChanges}
      setRequestingChanges={setRequestingChanges}
      executionError={executionError}
      setExecutionError={setExecutionError}
      requestChangesBlockedReason={requestChangesBlockedReason}
      onRequestChangesSubmitted={onRequestChangesSubmitted}
      initialContent={draft}
    />
  );
}
