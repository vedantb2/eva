"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type Id } from "@eva/backend";
import { AttachmentCard } from "@/lib/components/attachments/AttachmentCard";

/**
 * Read-only "Files" section for a task's attachments. Each card opens the stored
 * blob in a new tab. Files are attached when the task is created; they cannot be
 * added or removed here.
 */
export function TaskAttachments({ taskId }: { taskId: Id<"agentTasks"> }) {
  const attachments = useQuery(api.agentTasks.listAttachments, { taskId });
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
              />
            </a>
          ) : null,
        )}
      </div>
    </div>
  );
}
