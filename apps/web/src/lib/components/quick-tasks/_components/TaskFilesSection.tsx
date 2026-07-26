"use client";

import { useRef } from "react";
import { IconPaperclip } from "@tabler/icons-react";
import { AttachmentCard } from "@/lib/components/attachments/AttachmentCard";
import { chatAttachmentAccept } from "@/lib/components/attachments/attachmentMeta";
import type { TaskAttachment } from "../useTaskAttachments";

interface TaskFilesSectionProps {
  attachments: TaskAttachment[];
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
}

/**
 * Quick task composer file picker: a paperclip button plus a "Files" list of
 * the attached cards. Pasting an image into the description and dropping files
 * onto the modal both feed the same `onAdd`.
 */
export function TaskFilesSection({
  attachments,
  onAdd,
  onRemove,
}: TaskFilesSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2 px-5 pb-2">
      {attachments.length > 0 ? (
        <>
          <span className="text-xs font-medium text-muted-foreground">
            Files
          </span>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <AttachmentCard
                key={attachment.key}
                name={attachment.name}
                contentType={attachment.contentType}
                url={attachment.url}
                onRemove={() => onRemove(attachment.key)}
              />
            ))}
          </div>
        </>
      ) : null}

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
        >
          <IconPaperclip size={14} />
          <span>Attach files</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={chatAttachmentAccept("sessionFiles")}
          className="hidden"
          onChange={(e) => {
            onAdd(Array.from(e.target.files ?? []));
            // Reset so picking the same file again still fires onChange.
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
