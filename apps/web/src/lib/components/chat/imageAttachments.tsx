import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api, type Id } from "@conductor/backend";
import {
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@conductor/ui";
import { IconX } from "@tabler/icons-react";
import { parseStorageId } from "@/lib/components/artifacts/_meta";

/**
 * Shared image-attachment pieces for the chat composers (ChatBody + design
 * chat). Images are pasted/dropped into the prompt-input attachment context,
 * uploaded to Convex storage on send, and rendered back in the user message.
 */

export const MAX_IMAGE_ATTACHMENTS = 5;
export const MAX_IMAGE_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export function imageAttachmentErrorMessage(err: {
  code: "max_files" | "max_file_size" | "accept";
}): string {
  switch (err.code) {
    case "max_files":
      return `You can attach up to ${MAX_IMAGE_ATTACHMENTS} images.`;
    case "max_file_size":
      return "Images must be 10 MB or smaller.";
    case "accept":
      return "Only image files can be attached.";
  }
}

/**
 * Returns a function that uploads pasted/dropped composer images to Convex
 * storage (the prompt-input layer has already converted their blob URLs to data
 * URLs) and yields the resulting storage ids. Non-image files and failed
 * uploads are dropped.
 */
export function useUploadImageAttachments() {
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  return useCallback(
    async (files: PromptInputMessage["files"]): Promise<Id<"_storage">[]> => {
      const images = files.filter((file) =>
        file.mediaType?.startsWith("image/"),
      );
      const results = await Promise.all(
        images.map(async (file) => {
          try {
            const blob = await (await fetch(file.url)).blob();
            const uploadUrl = await generateUploadUrl({});
            const res = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": file.mediaType ?? blob.type },
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
    },
    [generateUploadUrl],
  );
}

/**
 * A row of thumbnails for the images currently attached in the composer, shown
 * above the input. Each has a remove button. Renders nothing when empty. Must be
 * rendered inside <PromptInput> so it reads the validated attachment context.
 */
export function ChatAttachmentPreview() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 border-b border-border p-2">
      {attachments.files.map((file) => (
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
            aria-label="Remove image"
            onClick={() => attachments.remove(file.id)}
            className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-background"
          >
            <IconX className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Renders a user message's attached input images as thumbnails that open full size. */
export function UserAttachmentImages({ urls }: { urls?: (string | null)[] }) {
  const resolved = (urls ?? []).filter((url): url is string => Boolean(url));
  if (resolved.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {resolved.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block size-24 overflow-hidden rounded-surface border border-border bg-muted"
        >
          <img
            src={url}
            alt="Attached image"
            className="size-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}
