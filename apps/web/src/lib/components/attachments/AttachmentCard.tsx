import { IconX } from "@tabler/icons-react";
import {
  iconForAttachment,
  isImageContentType,
  labelForAttachment,
} from "./attachmentMeta";

interface AttachmentCardProps {
  /** Original filename when known — absent for stored attachments. */
  name?: string;
  contentType: string | null;
  /** Object URL while composing, signed storage URL once uploaded. */
  url: string | null;
  /** Omit to render a read-only card. */
  onRemove?: () => void;
}

/**
 * One attached file: an image thumbnail or a type icon, plus its name. Shared
 * by the quick task composer and the task detail view so both read alike.
 */
export function AttachmentCard({
  name,
  contentType,
  url,
  onRemove,
}: AttachmentCardProps) {
  const label = labelForAttachment(name, contentType);
  const FileIcon = iconForAttachment(name, contentType);
  const showThumbnail = isImageContentType(contentType) && url !== null;

  return (
    <div className="group relative flex w-52 max-w-full items-center gap-2 rounded-surface border border-border bg-muted px-2 py-1.5">
      {showThumbnail ? (
        <img
          src={url}
          alt={label}
          className="size-8 shrink-0 rounded-sm border border-border object-cover"
        />
      ) : (
        <FileIcon className="size-8 shrink-0 p-1.5 text-muted-foreground" />
      )}
      <span className="truncate text-xs text-foreground">{label}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className="absolute right-0.5 top-0.5 rounded-full bg-background/80 p-0.5 text-foreground opacity-0 shadow-sm transition-opacity hover:bg-background focus:opacity-100 group-hover:opacity-100"
        >
          <IconX className="size-3" />
        </button>
      ) : null}
    </div>
  );
}
