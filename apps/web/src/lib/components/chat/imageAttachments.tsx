import { useMutation } from "convex/react";
import { api, type Id } from "@conductor/backend";
import {
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@conductor/ui";
import {
  IconFile,
  IconFileTypeTxt,
  IconHtml,
  IconMarkdown,
  IconX,
  type Icon,
} from "@tabler/icons-react";
import { parseStorageId } from "@/lib/components/artifacts/_meta";

/**
 * Shared chat attachment pieces (ChatBody + design chat). Files are pasted/
 * dropped into the prompt-input attachment context, uploaded to Convex storage
 * on send, materialized into the sandbox as `/tmp/eva-attachment-*`, and shown
 * back on the user message.
 */

export const MAX_CHAT_ATTACHMENTS = 5;
export const MAX_CHAT_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

/** Images only — project sandbox, design chat, default ChatComposer. */
export const IMAGE_ATTACHMENT_ACCEPT = "image/*";

/**
 * Session coding chat: images plus design/spec text files (Claude Design HTML
 * exports, markdown/txt specs).
 */
export const SESSION_ATTACHMENT_ACCEPT =
  "image/*,text/html,text/markdown,text/plain,.html,.htm,.md,.txt";

const SESSION_TEXT_EXTENSIONS = [".html", ".htm", ".md", ".txt"] as const;

export type ChatAttachmentMode = "images" | "sessionFiles";

export type ChatAttachmentMeta = {
  url: string | null;
  contentType: string | null;
};

/** @deprecated Prefer MAX_CHAT_ATTACHMENTS — kept for existing imports. */
export const MAX_IMAGE_ATTACHMENTS = MAX_CHAT_ATTACHMENTS;
/** @deprecated Prefer MAX_CHAT_ATTACHMENT_BYTES. */
export const MAX_IMAGE_ATTACHMENT_BYTES = MAX_CHAT_ATTACHMENT_BYTES;

export function chatAttachmentAccept(mode: ChatAttachmentMode): string {
  return mode === "sessionFiles"
    ? SESSION_ATTACHMENT_ACCEPT
    : IMAGE_ATTACHMENT_ACCEPT;
}

export function chatAttachmentErrorMessage(
  mode: ChatAttachmentMode,
  err: { code: "max_files" | "max_file_size" | "accept" },
): string {
  const noun = mode === "sessionFiles" ? "files" : "images";
  switch (err.code) {
    case "max_files":
      return `You can attach up to ${MAX_CHAT_ATTACHMENTS} ${noun}.`;
    case "max_file_size":
      return mode === "sessionFiles"
        ? "Attachments must be 10 MB or smaller."
        : "Images must be 10 MB or smaller.";
    case "accept":
      return mode === "sessionFiles"
        ? "Only images, HTML, Markdown, or plain text can be attached."
        : "Only image files can be attached.";
  }
}

/** @deprecated Prefer chatAttachmentErrorMessage("images", err). */
export function imageAttachmentErrorMessage(err: {
  code: "max_files" | "max_file_size" | "accept";
}): string {
  return chatAttachmentErrorMessage("images", err);
}

function filenameExtension(name: string): string {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return "";
  return lower.slice(dot);
}

/** Icon for a non-image composer/message attachment, keyed by MIME or extension. */
function iconForAttachment(
  filename: string | undefined,
  contentType: string | null | undefined,
): Icon {
  const type = (contentType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  const ext = filenameExtension(filename ?? "");

  if (
    type === "text/markdown" ||
    type === "text/x-markdown" ||
    ext === ".md" ||
    ext === ".markdown"
  ) {
    return IconMarkdown;
  }
  if (type === "text/html" || ext === ".html" || ext === ".htm") {
    return IconHtml;
  }
  if (type === "text/plain" || ext === ".txt") {
    return IconFileTypeTxt;
  }
  return IconFile;
}

function isSessionTextAttachment(
  mediaType: string | undefined,
  filename: string | undefined,
): boolean {
  const type = (mediaType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (
    type === "text/html" ||
    type === "text/markdown" ||
    type === "text/plain"
  ) {
    return true;
  }
  const ext = filenameExtension(filename ?? "");
  return SESSION_TEXT_EXTENSIONS.some((allowed) => allowed === ext);
}

function isAllowedComposerFile(
  mode: ChatAttachmentMode,
  file: PromptInputMessage["files"][number],
): boolean {
  if (file.mediaType?.startsWith("image/")) return true;
  if (mode === "sessionFiles") {
    return isSessionTextAttachment(file.mediaType, file.filename);
  }
  return false;
}

function contentTypeForUpload(
  file: PromptInputMessage["files"][number],
  blobType: string,
): string {
  const declared = file.mediaType?.trim();
  if (declared) return declared;
  if (blobType) return blobType;
  const ext = filenameExtension(file.filename ?? "");
  switch (ext) {
    case ".html":
    case ".htm":
      return "text/html";
    case ".md":
      return "text/markdown";
    case ".txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

/**
 * Uploads composer attachments allowed by `mode` to Convex storage.
 * Disallowed / failed files are dropped.
 */
export function useUploadChatAttachments(mode: ChatAttachmentMode) {
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  return async (
    files: PromptInputMessage["files"],
  ): Promise<Id<"_storage">[]> => {
    const allowed = files.filter((file) => isAllowedComposerFile(mode, file));
    const results = await Promise.all(
      allowed.map(async (file) => {
        try {
          const blob = await (await fetch(file.url)).blob();
          const uploadUrl = await generateUploadUrl({});
          const contentType = contentTypeForUpload(file, blob.type);
          const res = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": contentType },
            body: blob,
          });
          if (!res.ok) return null;
          return parseStorageId(await res.text());
        } catch {
          return null;
        }
      }),
    );
    return results.filter((id): id is Id<"_storage"> => id !== null);
  };
}

/** @deprecated Prefer useUploadChatAttachments("images"). */
export function useUploadImageAttachments() {
  return useUploadChatAttachments("images");
}

function isImageContentType(contentType: string | null | undefined): boolean {
  return (contentType ?? "").startsWith("image/");
}

function labelForAttachment(
  filename: string | undefined,
  contentType: string | null | undefined,
): string {
  if (filename?.trim()) return filename.trim();
  const type = (contentType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (type === "text/html") return "design.html";
  if (type === "text/markdown") return "spec.md";
  if (type === "text/plain") return "notes.txt";
  return "Attachment";
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

/** @deprecated Prefer UserMessageAttachments. */
export function UserAttachmentImages({ urls }: { urls?: (string | null)[] }) {
  return (
    <UserMessageAttachments
      attachments={(urls ?? []).map((url) => ({
        url,
        contentType: url ? "image/*" : null,
      }))}
    />
  );
}
