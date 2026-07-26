"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type Id } from "@eva/backend";
import { AttachmentCard } from "@/lib/components/attachments/AttachmentCard";
import { labelForAttachment } from "@/lib/components/attachments/attachmentMeta";
import { ConfirmDialog } from "@/lib/components/quick-tasks/_components/ConfirmDialog";

/**
 * "Files" section for a task's attachments. Each card opens the stored blob in a
 * new tab; hovering reveals a remove button. Removing deletes the stored blob,
 * so it is confirmed first and cannot be undone. Files can only be added when
 * the task is created.
 */
export function TaskAttachments({ taskId }: { taskId: Id<"agentTasks"> }) {
  const attachments = useQuery(api.agentTasks.listAttachments, { taskId });
  const removeAttachment = useMutation(api.agentTasks.removeAttachment);
  // The file awaiting confirmation, held until the user confirms or cancels.
  const [pending, setPending] = useState<{
    storageId: Id<"_storage">;
    label: string;
  } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleConfirm() {
    if (!pending) return;
    setIsRemoving(true);
    try {
      await removeAttachment({ taskId, storageId: pending.storageId });
      setPending(null);
    } finally {
      setIsRemoving(false);
    }
  }

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Files</span>
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) =>
          attachment.url ? (
            <a
              key={attachment.storageId}
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-surface transition-opacity hover:opacity-80"
            >
              <AttachmentCard
                contentType={attachment.contentType}
                url={attachment.url}
                onRemove={() =>
                  setPending({
                    storageId: attachment.storageId,
                    label: labelForAttachment(
                      undefined,
                      attachment.contentType,
                    ),
                  })
                }
              />
            </a>
          ) : null,
        )}
      </div>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !isRemoving) setPending(null);
        }}
        title="Remove file"
        description={
          <>
            Are you sure you want to remove <strong>{pending?.label}</strong>{" "}
            from this task?
          </>
        }
        detail="The file is deleted from storage. This action cannot be undone."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleConfirm}
        isLoading={isRemoving}
      />
    </div>
  );
}
