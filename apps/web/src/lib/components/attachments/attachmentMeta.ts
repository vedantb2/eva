import {
  IconFile,
  IconFileTypeTxt,
  IconHtml,
  IconMarkdown,
  type Icon,
} from "@tabler/icons-react";

/**
 * Shared rules and labelling for user-attached files, used by the chat
 * composer, the quick task composer, and the task detail view. Keeping the
 * accept lists and limits in one place means every surface rejects the same
 * files with the same wording.
 */

export const MAX_CHAT_ATTACHMENTS = 5;
export const MAX_CHAT_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

/** Images only — project sandbox, design chat, default ChatComposer. */
export const IMAGE_ATTACHMENT_ACCEPT = "image/*";

/**
 * Session coding chat and quick tasks: images plus design/spec text files
 * (Claude Design HTML exports, markdown/txt specs).
 */
export const SESSION_ATTACHMENT_ACCEPT =
  "image/*,text/html,text/markdown,text/plain,.html,.htm,.md,.txt";

const SESSION_TEXT_EXTENSIONS = [".html", ".htm", ".md", ".txt"] as const;

export type ChatAttachmentMode = "images" | "sessionFiles";

/** The subset of file metadata the attachment rules need, from any source. */
export type AttachmentFileMeta = {
  mediaType?: string;
  filename?: string;
};

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

export function filenameExtension(name: string): string {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return "";
  return lower.slice(dot);
}

function normalizeContentType(contentType: string | null | undefined): string {
  return (contentType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}

export function isImageContentType(
  contentType: string | null | undefined,
): boolean {
  return normalizeContentType(contentType).startsWith("image/");
}

/** Icon for a non-image attachment, keyed by MIME type or extension. */
export function iconForAttachment(
  filename: string | undefined,
  contentType: string | null | undefined,
): Icon {
  const type = normalizeContentType(contentType);
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

/**
 * Display name for an attachment. Stored attachments are only an array of
 * storage ids, so once uploaded the original filename is gone and the content
 * type provides the fallback label.
 */
export function labelForAttachment(
  filename: string | undefined,
  contentType: string | null | undefined,
): string {
  if (filename?.trim()) return filename.trim();
  const type = normalizeContentType(contentType);
  if (type === "text/html") return "design.html";
  if (type === "text/markdown") return "spec.md";
  if (type === "text/plain") return "notes.txt";
  if (type.startsWith("image/")) return "Image";
  return "Attachment";
}

function isSessionTextAttachment(file: AttachmentFileMeta): boolean {
  const type = normalizeContentType(file.mediaType);
  if (
    type === "text/html" ||
    type === "text/markdown" ||
    type === "text/plain"
  ) {
    return true;
  }
  const ext = filenameExtension(file.filename ?? "");
  return SESSION_TEXT_EXTENSIONS.some((allowed) => allowed === ext);
}

export function isAllowedAttachmentFile(
  mode: ChatAttachmentMode,
  file: AttachmentFileMeta,
): boolean {
  if (isImageContentType(file.mediaType)) return true;
  if (mode === "sessionFiles") return isSessionTextAttachment(file);
  return false;
}

/**
 * Content type to store the blob under. Prefers what the source declared, then
 * what the blob reports, then the filename extension.
 */
export function contentTypeForUpload(
  file: AttachmentFileMeta,
  blobType: string,
): string {
  const declared = file.mediaType?.trim();
  if (declared) return declared;
  if (blobType) return blobType;
  switch (filenameExtension(file.filename ?? "")) {
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
