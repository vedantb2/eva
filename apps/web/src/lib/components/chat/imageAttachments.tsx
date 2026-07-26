import { type Id } from "@eva/backend";
import { usePromptInputAttachments, type PromptInputMessage } from "@eva/ui";
import { IconX } from "@tabler/icons-react";
import {
  chatAttachmentErrorMessage,
  contentTypeForUpload,
  iconForAttachment,
  isAllowedAttachmentFile,
  isImageContentType,
  labelForAttachment,
  type ChatAttachmentMode,
} from "@/lib/components/attachments/attachmentMeta";
import { useUploadBlobs } from "@/lib/components/attachments/useUploadBlobs";

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
  chatAttachmentAccept,
  chatAttachmentErrorMessage,
  type ChatAttachmentMode,
} from "@/lib/components/attachments/attachmentMeta";

export type ChatAttachmentMeta = {
  url: string | null;
  contentType: string | null;
};

/** @deprecated Prefer chatAttachmentErrorMessage("images", err). */
export function imageAttachmentErrorMessage(err: {
  code: "max_files" | "max_file_size" | "accept";
}): string {
  return chatAttachmentErrorMessage("images", err);
}

/**
 * Uploads composer attachments allowed by `mode` to Convex storage.
 * Disallowed / failed files are dropped.
 */
export function useUploadChatAttachments(mode: ChatAttachmentMode) {
  const uploadBlobs = useUploadBlobs();
  return async (
    files: PromptInputMessage["files"],
  ): Promise<Id<"_storage">[]> => {
    const allowed = files.filter((file) => isAllowedAttachmentFile(mode, file));
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

/** @deprecated Prefer useUploadChatAttachments("images"). */
export function useUploadImageAttachments() {
  return useUploadChatAttachments("images");
}

/**
 * Composer attachment strip: image thumbnails + file chips for text/HTML.
 * Must be inside <PromptInput>.
 */
export function ChatAttachmentPreview() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 border-b border-border p-2">
      {attachments.files.map((file) => {
        const isImage = file.mediaType?.startsWith("image/");
        const FileIcon = iconForAttachment(file.filename, file.mediaType);
        return (
          <div
            key={file.id}
            className={
              isImage
                ? "group relative size-16 overflow-hidden rounded-surface border border-border bg-muted"
                : "group relative flex max-w-[12rem] items-center gap-2 rounded-surface border border-border bg-muted px-2 py-1.5"
            }
          >
            {isImage ? (
              <img
                src={file.url}
                alt={file.filename ?? "Attached image"}
                className="size-full object-cover"
              />
            ) : (
              <>
                <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-xs text-foreground">
                  {labelForAttachment(file.filename, file.mediaType)}
                </span>
              </>
            )}
            <button
              type="button"
              aria-label="Remove attachment"
              onClick={() => attachments.remove(file.id)}
              className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-background"
            >
              <IconX className="size-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Renders a user message's attachments — image thumbs or downloadable file chips. */
export function UserMessageAttachments({
  attachments,
}: {
  attachments?: ChatAttachmentMeta[];
}) {
  const resolved = (attachments ?? []).filter(
    (item): item is { url: string; contentType: string | null } =>
      Boolean(item.url),
  );
  if (resolved.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {resolved.map((item) => {
        if (isImageContentType(item.contentType)) {
          return (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block size-24 overflow-hidden rounded-surface border border-border bg-muted"
            >
              <img
                src={item.url}
                alt="Attached image"
                className="size-full object-cover"
              />
            </a>
          );
        }
        const FileIcon = iconForAttachment(undefined, item.contentType);
        return (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="flex max-w-[14rem] items-center gap-2 rounded-surface border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/80"
          >
            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {labelForAttachment(undefined, item.contentType)}
            </span>
          </a>
        );
      })}
    </div>
  );
}
