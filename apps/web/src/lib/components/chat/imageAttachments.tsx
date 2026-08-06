import { type Id } from "@eva/backend";
import {
  usePromptInputAttachments,
  toast,
  type PromptInputMessage,
} from "@eva/ui";
import { IconX } from "@tabler/icons-react";
import { useState } from "react";
import {
  contentTypeForUpload,
  iconForAttachment,
  isAllowedAttachmentFile,
  labelForAttachment,
} from "@/lib/components/attachments/attachmentMeta";
import { TextAttachmentModal } from "@/lib/components/attachments/TextAttachmentModal";
import { useUploadBlobs } from "@/lib/components/attachments/useUploadBlobs";
import { UserMessageAttachments } from "@/lib/components/chat/UserMessageAttachments";

/**
 * Chat-specific attachment pieces. Files are pasted/dropped into the
 * prompt-input attachment context, uploaded to Convex storage on send,
 * materialized into the sandbox as `/tmp/eva-attachment-*`, and shown back on
 * the user message. The accept lists, limits, and labelling live in
 * `@/lib/components/attachments/attachmentMeta` and are re-exported here for
 * existing callers.
 */

export {
  MAX_CHAT_ATTACHMENTS,
  MAX_CHAT_ATTACHMENT_BYTES,
  IMAGE_ATTACHMENT_ACCEPT,
  CHAT_ATTACHMENT_ACCEPT,
  chatAttachmentErrorMessage,
} from "@/lib/components/attachments/attachmentMeta";

export type { ChatAttachmentMeta } from "@/lib/components/chat/UserMessageAttachments";
export { UserMessageAttachments };

/**
 * Uploads composer attachments to Convex storage.
 * Disallowed / failed files are dropped.
 */
export function useUploadChatAttachments() {
  const uploadBlobs = useUploadBlobs();
  return async (
    files: PromptInputMessage["files"],
  ): Promise<Id<"_storage">[]> => {
    const allowed = files.filter((file) => isAllowedAttachmentFile(file));
    const items = await Promise.all(
      allowed.map(async (file) => {
        const blob = await (await fetch(file.url)).blob();
        return { blob, contentType: contentTypeForUpload(file, blob.type) };
      }),
    );
    const ids = await uploadBlobs(items);
    return ids.filter((id): id is Id<"_storage"> => id !== null);
  };
}

type OpenTextAttachment = {
  title: string;
  text: string;
  fileId: string;
  filename: string;
  mediaType: string;
};

/**
 * Composer attachment strip: image thumbnails + file chips for text/HTML.
 * Must be inside <PromptInput>. Clicking a non-image chip opens an editable
 * text modal; Save replaces the attachment in place.
 */
export function ChatAttachmentPreview() {
  const attachments = usePromptInputAttachments();
  const [open, setOpen] = useState<OpenTextAttachment | null>(null);

  if (attachments.files.length === 0 && open === null) return null;

  return (
    <>
      {attachments.files.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          {attachments.files.map((file) => {
            const isImage = file.mediaType?.startsWith("image/");
            const FileIcon = iconForAttachment(file.filename, file.mediaType);
            const label = labelForAttachment(file.filename, file.mediaType);

            if (isImage) {
              return (
                <div
                  key={file.id}
                  className="group relative size-16 overflow-hidden rounded-surface border border-border bg-muted"
                >
                  <img
                    src={file.url}
                    alt={file.filename ?? "Attached image"}
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remove attachment"
                    onClick={() => attachments.remove(file.id)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 text-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-background"
                  >
                    <IconX className="size-3" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={file.id}
                className="group relative flex max-w-48 items-center gap-2 rounded-surface border border-border bg-muted px-2 py-1.5"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => {
                    void (async () => {
                      try {
                        const response = await fetch(file.url);
                        if (!response.ok) {
                          toast.error("Could not load attachment.");
                          return;
                        }
                        const text = await response.text();
                        setOpen({
                          title: label,
                          text,
                          fileId: file.id,
                          filename: file.filename ?? "pasted-text.txt",
                          mediaType: file.mediaType || "text/plain",
                        });
                      } catch {
                        toast.error("Could not load attachment.");
                      }
                    })();
                  }}
                >
                  <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs text-foreground">
                    {label}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Remove attachment"
                  onClick={() => attachments.remove(file.id)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 text-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-background"
                >
                  <IconX className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {open ? (
        <TextAttachmentModal
          title={open.title}
          text={open.text}
          readOnly={false}
          onClose={() => setOpen(null)}
          onSave={(nextText) => {
            attachments.replace(
              open.fileId,
              new File([nextText], open.filename, { type: open.mediaType }),
            );
            setOpen(null);
          }}
        />
      ) : null}
    </>
  );
}
